// =============================================================================
// VEN Feedback Intelligence Service (FIS)
// Edge Function: process-feedback-voice
//
// Triggered by: database webhook (pg_net POST) on INSERT of a voice row
// Also callable manually via: POST /functions/v1/process-feedback-voice
//   with body: { "submission_id": "uuid" }
//
// What it does:
//   1. Validates the incoming payload
//   2. Marks the submission as "processing"
//   3. Downloads the audio file from private Supabase Storage
//   4. Sends audio to OpenAI Whisper for transcription
//   5. Sends transcript to GPT-4o-mini for structured JSON summary
//   6. Saves transcript + summary to feedback_ai_results
//   7. Updates status columns to "completed" (or "failed" with error info)
//
// Secrets required (set via: supabase secrets set KEY=value):
//   OPENAI_API_KEY         — OpenAI API key
//   SUPABASE_URL           — auto-provided by Supabase runtime
//   SUPABASE_SERVICE_ROLE_KEY — auto-provided by Supabase runtime
// =============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";
import OpenAI, { toFile } from "npm:openai@4";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IncomingPayload {
  submission_id: string;
  audio_path?: string;
  user_id?: string;
  source_screen?: string;
  task_area?: string;
  feeling?: string;
  message_text?: string;
  // Supabase DB webhook wraps the new row under "record"
  record?: {
    id: string;
    audio_path?: string;
    submission_type?: string;
    [key: string]: unknown;
  };
  type?: string; // "INSERT" from DB webhook
}

interface FeedbackSummary {
  one_line_summary: string;
  main_issue: string;
  feature_area:
    | "profile_dashboard"
    | "document_vault"
    | "benefits_explanation"
    | "forms_guides"
    | "dependents_family"
    | "education_benefits"
    | "state_benefits"
    | "veteran_news"
    | "general_app_experience"
    | "other";
  sentiment: "helpful" | "confused" | "frustrated" | "easy" | "neutral";
  priority: "low" | "medium" | "high";
  suggested_improvement: string;
  needs_human_review: boolean;
  redaction_notes: string;
}

// Valid controlled-vocabulary values — used for fallback sanitization
const VALID_FEATURE_AREAS = [
  "profile_dashboard", "document_vault", "benefits_explanation",
  "forms_guides", "dependents_family", "education_benefits",
  "state_benefits", "veteran_news", "general_app_experience", "other",
] as const;

const VALID_SENTIMENTS = ["helpful", "confused", "frustrated", "easy", "neutral"] as const;
const VALID_PRIORITIES = ["low", "medium", "high"] as const;

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  // Only accept POST
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const expectedSecret = Deno.env.get("FIS_WEBHOOK_SECRET");
  const incomingSecret = req.headers.get("x-fis-webhook-secret");

  if (!expectedSecret || !incomingSecret || incomingSecret !== expectedSecret) {
    console.error("[FIS] Unauthorized: webhook secret missing or invalid");
    return json({ error: "Unauthorized" }, 401);
  }

  // ---------------------------------------------------------------------------
  // 1. Parse and normalize the payload
  //    The DB webhook sends: { type: "INSERT", record: { id, audio_path, ... } }
  //    Manual test sends:    { submission_id: "uuid" }
  // ---------------------------------------------------------------------------
  let payload: IncomingPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  // Normalize: DB webhook vs manual call
  let submissionId: string | undefined;
  let audioPath: string | undefined;

  if (payload.type === "INSERT" && payload.record) {
    // Coming from pg_net / Supabase DB webhook
    submissionId = payload.record.id;
    audioPath = payload.record.audio_path ?? undefined;

    // Skip non-voice rows (the trigger already filters, but double-check here)
    if (payload.record.submission_type !== "voice" || !audioPath) {
      return json({ skipped: true, reason: "Not a voice row with audio_path" }, 200);
    }
  } else if (payload.submission_id) {
    // Manual test / direct invocation
    submissionId = payload.submission_id;
    audioPath = payload.audio_path;
  } else {
    return json({ error: "Missing submission_id or record.id in payload" }, 400);
  }

  if (!submissionId) {
    return json({ error: "Could not determine submission_id" }, 400);
  }

  console.log(`[FIS] Starting processing for submission: ${submissionId}`);

  // ---------------------------------------------------------------------------
  // 2. Initialize Supabase admin client
  //    Uses SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase runtime.
  //    This bypasses RLS so the function can read/write freely.
  // ---------------------------------------------------------------------------
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const openAiKey = Deno.env.get("OPENAI_API_KEY");

  if (!supabaseUrl || !serviceRoleKey || !openAiKey) {
    const missing = [
      !supabaseUrl && "SUPABASE_URL",
      !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
      !openAiKey && "OPENAI_API_KEY",
    ].filter(Boolean).join(", ");
    console.error(`[FIS] Missing secrets: ${missing}`);
    return json({ error: `Missing required secrets: ${missing}` }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const openai = new OpenAI({ apiKey: openAiKey });

  // ---------------------------------------------------------------------------
  // 3. Fetch the submission row (in case we only got the ID from manual call)
  // ---------------------------------------------------------------------------
  const { data: submission, error: fetchError } = await supabase
    .from("feedback_submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (fetchError || !submission) {
    console.error(`[FIS] Submission not found: ${submissionId}`, fetchError);
    return json({ error: "Submission not found", detail: fetchError?.message }, 404);
  }

  // Use audio_path from the row if not in payload
  if (!audioPath) {
    audioPath = submission.audio_path as string | undefined;
  }

  if (!audioPath) {
    console.error(`[FIS] No audio_path on submission ${submissionId}`);
    await markFailed(supabase, submissionId, "No audio_path on submission");
    return json({ error: "No audio_path on submission" }, 422);
  }

  // ---------------------------------------------------------------------------
  // 4. Upsert a result row with status = processing
  //    Creates the result row early so we can update it even if we fail later.
  // ---------------------------------------------------------------------------
  const { error: upsertError } = await supabase
    .from("feedback_ai_results")
    .upsert(
      {
        feedback_submission_id: submissionId,
        processing_status: "processing",
        model_name: "whisper-1 + gpt-4o-mini",
      },
      { onConflict: "feedback_submission_id" }
    );

  if (upsertError) {
    console.error(`[FIS] Failed to create result row:`, upsertError);
    return json({ error: "DB upsert failed", detail: upsertError.message }, 500);
  }

  // Mark transcript as processing on the submission row
  await supabase
    .from("feedback_submissions")
    .update({ transcript_status: "processing" })
    .eq("id", submissionId);

  // ---------------------------------------------------------------------------
  // 5. Download audio from private storage
  // ---------------------------------------------------------------------------
  let audioBlob: Blob;
  try {
    const { data: storageData, error: storageError } = await supabase.storage
      .from("feedback-audio")
      .download(audioPath);

    if (storageError || !storageData) {
      throw new Error(storageError?.message ?? "Storage download returned null");
    }
    audioBlob = storageData;
    console.log(`[FIS] Audio downloaded: ${audioPath} (${audioBlob.size} bytes)`);
  } catch (err) {
    const msg = `Storage download failed: ${(err as Error).message}`;
    console.error(`[FIS] ${msg}`);
    await markFailed(supabase, submissionId, msg, "transcript");
    return json({ error: msg }, 500);
  }

  // ---------------------------------------------------------------------------
  // 6. OpenAI Whisper transcription
  // ---------------------------------------------------------------------------
  let transcript: string;
  try {
    // Whisper requires a File object with a filename + correct MIME type
    const filename = audioPath.split("/").pop() ?? "audio.wav";
    const ext = filename.split(".").pop()?.toLowerCase() ?? "wav";
    const mimeMap: Record<string, string> = {
      wav: "audio/wav",
      m4a: "audio/m4a",
      mp3: "audio/mpeg",
      mp4: "audio/mp4",
      ogg: "audio/ogg",
      webm: "audio/webm",
    };
    const mimeType = mimeMap[ext] ?? "audio/wav";
    const bytes = new Uint8Array(await audioBlob.arrayBuffer());
    console.log("[FIS whisper] filename:", filename, "| mimeType:", mimeType, "| bytes:", bytes.length, "| first12:", Array.from(bytes.slice(0, 12)));
    const audioFile = await toFile(bytes, filename, { type: mimeType });

    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "text",
      language: "en",
    });

    // When response_format is "text", the SDK returns the transcript directly
    transcript = typeof transcriptionResponse === "string"
      ? transcriptionResponse
      : (transcriptionResponse as { text: string }).text;

    console.log(`[FIS] Transcript length: ${transcript.length} chars`);

    // Update transcript status to completed
    await supabase
      .from("feedback_submissions")
      .update({ transcript_status: "completed" })
      .eq("id", submissionId);

  } catch (err) {
    const msg = `Whisper transcription failed: ${(err as Error).message}`;
    console.error(`[FIS] ${msg}`);
    await markFailed(supabase, submissionId, msg, "transcript");
    return json({ error: msg }, 500);
  }

  // ---------------------------------------------------------------------------
  // 7. GPT-4o-mini structured JSON summary
  // ---------------------------------------------------------------------------
  let summary: FeedbackSummary;
  try {
    summary = await generateSummary(openai, transcript, submission);
    console.log(`[FIS] Summary generated. Priority: ${summary.priority}, Review: ${summary.needs_human_review}`);

    await supabase
      .from("feedback_submissions")
      .update({ summary_status: "completed" })
      .eq("id", submissionId);

  } catch (err) {
    const msg = `GPT summary failed: ${(err as Error).message}`;
    console.error(`[FIS] ${msg}`);
    await markFailed(supabase, submissionId, msg, "summary");
    return json({ error: msg }, 500);
  }

  // ---------------------------------------------------------------------------
  // 8. Save final result to feedback_ai_results
  // ---------------------------------------------------------------------------
  const { error: saveError } = await supabase
    .from("feedback_ai_results")
    .update({
      transcript:           transcript,
      one_line_summary:     summary.one_line_summary,
      main_issue:           summary.main_issue,
      feature_area:         summary.feature_area,
      sentiment:            summary.sentiment,
      priority:             summary.priority,
      suggested_improvement: summary.suggested_improvement,
      needs_human_review:   summary.needs_human_review,
      redaction_notes:      summary.redaction_notes,
      processing_status:    "completed",
      processed_at:         new Date().toISOString(),
      error_message:        null,
    })
    .eq("feedback_submission_id", submissionId);

  if (saveError) {
    const msg = `Failed to save results: ${saveError.message}`;
    console.error(`[FIS] ${msg}`);
    // Don't call markFailed here — transcript + summary succeeded
    return json({ error: msg }, 500);
  }

  console.log(`[FIS] ✅ Processing complete for submission: ${submissionId}`);

  return json({
    success: true,
    submission_id: submissionId,
    transcript_chars: transcript.length,
    priority: summary.priority,
    needs_human_review: summary.needs_human_review,
    feature_area: summary.feature_area,
    sentiment: summary.sentiment,
  });
});

// ---------------------------------------------------------------------------
// generateSummary: calls GPT-4o-mini with a strict JSON prompt
// ---------------------------------------------------------------------------

async function generateSummary(
  openai: OpenAI,
  transcript: string,
  submission: Record<string, unknown>
): Promise<FeedbackSummary> {

  const systemPrompt = `You are a backend AI assistant for the VEN App — a mobile app that helps US military veterans navigate VA benefits. You analyze voice feedback from veterans and return a strict JSON object.

RULES:
- Return ONLY valid JSON. No markdown. No commentary. No code fences.
- All fields are required — never omit any.
- Use only the exact values listed for controlled fields.
- Set needs_human_review to true if the transcript contains: crisis language, suicidal ideation, expressions of severe distress, explicit sensitive PII (SSN, DOB, account numbers), or is too unclear/inaudible to summarize reliably.
- Redact any PII in your text outputs and note it in redaction_notes. If no PII, set redaction_notes to "none".

CONTROLLED FIELD VALUES:
feature_area: profile_dashboard | document_vault | benefits_explanation | forms_guides | dependents_family | education_benefits | state_benefits | veteran_news | general_app_experience | other
sentiment: helpful | confused | frustrated | easy | neutral
priority: low | medium | high

PRIORITY GUIDELINES:
- high: functional bug, data loss, inability to complete a critical task, or needs_human_review=true
- medium: confusing UX, missing feature, inconsistent behavior
- low: minor wording issues, cosmetic problems, general praise

OUTPUT FORMAT (exact keys, exact types):
{
  "one_line_summary": "string — one sentence, max 120 chars",
  "main_issue": "string — concise description of the core problem or praise",
  "feature_area": "one of the controlled values above",
  "sentiment": "one of the controlled values above",
  "priority": "one of the controlled values above",
  "suggested_improvement": "string — actionable next step, or 'none' if praise only",
  "needs_human_review": true | false,
  "redaction_notes": "string"
}`;

  const userPrompt = `Voice feedback transcript:
"""
${transcript.trim()}
"""

Additional context:
- Source screen: ${submission.source_screen ?? "unknown"}
- Task area: ${submission.task_area ?? "unknown"}
- User-reported feeling: ${submission.feeling ?? "not provided"}
- User typed message: ${submission.message_text ?? "none"}

Return the JSON summary now.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 600,
    temperature: 0.1, // low temp = more consistent structured output
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt },
    ],
    response_format: { type: "json_object" }, // enforce JSON mode
  });

  const rawContent = response.choices[0]?.message?.content ?? "";
  if (!rawContent) {
    throw new Error("GPT returned empty content");
  }

  // Parse and sanitize
  let parsed: Partial<FeedbackSummary>;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error(`GPT returned invalid JSON: ${rawContent.slice(0, 200)}`);
  }

  // Sanitize controlled fields — fall back to safe defaults if GPT goes rogue
  const featureArea = VALID_FEATURE_AREAS.includes(parsed.feature_area as typeof VALID_FEATURE_AREAS[number])
    ? parsed.feature_area!
    : "other";

  const sentiment = VALID_SENTIMENTS.includes(parsed.sentiment as typeof VALID_SENTIMENTS[number])
    ? parsed.sentiment!
    : "neutral";

  const priority = VALID_PRIORITIES.includes(parsed.priority as typeof VALID_PRIORITIES[number])
    ? parsed.priority!
    : "medium";

  return {
    one_line_summary:      (parsed.one_line_summary    ?? "No summary generated").slice(0, 120),
    main_issue:            parsed.main_issue           ?? "Unknown",
    feature_area:          featureArea,
    sentiment:             sentiment,
    priority:              priority,
    suggested_improvement: parsed.suggested_improvement ?? "none",
    needs_human_review:    parsed.needs_human_review   === true,
    redaction_notes:       parsed.redaction_notes      ?? "none",
  };
}

// ---------------------------------------------------------------------------
// markFailed: update submission + result rows when something goes wrong
// ---------------------------------------------------------------------------

async function markFailed(
  supabase: ReturnType<typeof createClient>,
  submissionId: string,
  errorMessage: string,
  failedStage?: "transcript" | "summary"
): Promise<void> {
  const updates: Record<string, string> = {};
  if (failedStage === "transcript") {
    updates.transcript_status = "failed";
    updates.summary_status = "failed"; // can't summarize without transcript
  } else if (failedStage === "summary") {
    updates.summary_status = "failed";
  } else {
    updates.transcript_status = "failed";
    updates.summary_status = "failed";
  }

  await Promise.allSettled([
    supabase
      .from("feedback_submissions")
      .update(updates)
      .eq("id", submissionId),

    supabase
      .from("feedback_ai_results")
      .upsert(
        {
          feedback_submission_id: submissionId,
          processing_status: "failed",
          error_message: errorMessage,
          processed_at: new Date().toISOString(),
        },
        { onConflict: "feedback_submission_id" }
      ),
  ]);
}

// ---------------------------------------------------------------------------
// json: convenience response helper
// ---------------------------------------------------------------------------

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
