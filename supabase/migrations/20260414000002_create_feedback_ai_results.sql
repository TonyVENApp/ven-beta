-- =============================================================================
-- VEN Feedback Intelligence Service (FIS)
-- Migration 002: feedback_ai_results table
-- =============================================================================

-- ---------------------------------------------------------------------------
-- feedback_ai_results
-- ---------------------------------------------------------------------------
-- Stores the transcript and structured AI summary output for each voice
-- submission. One row per feedback_submission (1:1 relationship).
-- This table is written exclusively by the Edge Function — the mobile app
-- never writes here directly.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.feedback_ai_results (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link back to the raw submission
  feedback_submission_id  UUID        NOT NULL UNIQUE
                                      REFERENCES public.feedback_submissions(id)
                                      ON DELETE CASCADE,

  -- --- Whisper transcription output ---
  transcript              TEXT,       -- full text from OpenAI Whisper

  -- --- Structured summary fields (from GPT-4o JSON output) ---
  one_line_summary        TEXT,
  main_issue              TEXT,

  -- Controlled vocabulary fields (validated by the Edge Function logic)
  feature_area            TEXT        CHECK (feature_area IN (
                            'profile_dashboard',
                            'document_vault',
                            'benefits_explanation',
                            'forms_guides',
                            'dependents_family',
                            'education_benefits',
                            'state_benefits',
                            'veteran_news',
                            'general_app_experience',
                            'other'
                          )),

  sentiment               TEXT        CHECK (sentiment IN (
                            'helpful', 'confused', 'frustrated', 'easy', 'neutral'
                          )),

  priority                TEXT        CHECK (priority IN ('low', 'medium', 'high')),

  suggested_improvement   TEXT,

  -- Human review flag
  -- TRUE when: urgency language, crisis signals, severe distress, sensitive PII,
  --            or transcript is too unclear to trust
  needs_human_review      BOOLEAN     NOT NULL DEFAULT false,

  -- Notes from AI about any redacted or masked content
  redaction_notes         TEXT,

  -- --- Processing metadata ---
  processing_status       TEXT        NOT NULL DEFAULT 'not_started'
                                      CHECK (processing_status IN (
                                        'not_started', 'processing', 'completed', 'failed'
                                      )),

  -- Full error string saved when processing_status = 'failed'
  error_message           TEXT,

  -- Timestamps
  processed_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Which model produced this result
  model_name              TEXT        -- e.g. 'whisper-1 + gpt-4o-mini'
);

-- Index: look up result by submission
CREATE INDEX idx_feedback_ai_results_submission_id
  ON public.feedback_ai_results(feedback_submission_id);

-- Index: find rows needing human review
CREATE INDEX idx_feedback_ai_results_human_review
  ON public.feedback_ai_results(needs_human_review)
  WHERE needs_human_review = true;

-- Index: find failed rows for retry / debugging
CREATE INDEX idx_feedback_ai_results_status
  ON public.feedback_ai_results(processing_status);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.feedback_ai_results ENABLE ROW LEVEL SECURITY;

-- App users should NOT read AI result rows directly from the client.
-- Results should be surfaced through a controlled API / admin layer.
-- For now: deny all client access; service role (Edge Function) bypasses RLS.

-- Allow users to read AI results linked to their own submissions only
-- (safe for showing a summary back to the user in a future feature)
CREATE POLICY "Users can read AI results for own submissions"
  ON public.feedback_ai_results FOR SELECT
  TO authenticated
  USING (
    feedback_submission_id IN (
      SELECT id FROM public.feedback_submissions
      WHERE user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE from the client — service role only
-- (RLS default-deny covers this)

COMMENT ON TABLE public.feedback_ai_results IS
  'AI-generated transcript and structured summary for each VEN voice feedback submission. '
  'Written exclusively by the process-feedback-voice Edge Function. '
  'One row per feedback_submission (1:1, CASCADE delete).';
