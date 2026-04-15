-- =============================================================================
-- VEN Feedback Intelligence Service (FIS)
-- Migration 001: feedback_submissions table + private audio storage bucket
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Private storage bucket for voice feedback audio files
-- ---------------------------------------------------------------------------
-- This bucket is PRIVATE — files are never accessible via public URL.
-- The Edge Function accesses them via the service role key.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-audio',
  'feedback-audio',
  false,                          -- NOT public
  26214400,                       -- 25 MB max per file
  ARRAY['audio/m4a', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/aac']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: authenticated users can upload their own audio only
CREATE POLICY "Users can upload their own feedback audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feedback-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy: users can read their own audio only
CREATE POLICY "Users can read their own feedback audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'feedback-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Service role can do everything (used by the Edge Function)
-- The service role bypasses RLS by default — no extra policy needed.

-- ---------------------------------------------------------------------------
-- 2. feedback_submissions table
-- ---------------------------------------------------------------------------
-- Stores raw feedback data submitted by the mobile app.
-- AI results are kept in a separate table (feedback_ai_results).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.feedback_submissions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- What kind of feedback this is
  submission_type   TEXT        NOT NULL DEFAULT 'general'
                                CHECK (submission_type IN ('voice', 'text', 'mixed')),

  -- Where in the app it came from
  source_screen     TEXT,       -- e.g. 'BenefitsExplanationScreen'
  task_area         TEXT,       -- e.g. 'claims_walkthrough'

  -- User-provided content
  feeling           TEXT,       -- e.g. 'confused', 'frustrated', 'happy'
  message_text      TEXT,       -- typed feedback (nullable if voice-only)
  improvement_text  TEXT,       -- typed improvement suggestion (optional)

  -- Voice file location in storage bucket (path relative to bucket root)
  -- Format: {user_id}/{submission_id}.m4a  (set by the app before INSERT)
  audio_path        TEXT,

  -- Processing status flags for each AI stage
  -- not_started → processing → completed | failed
  transcript_status TEXT        NOT NULL DEFAULT 'not_started'
                                CHECK (transcript_status IN ('not_started', 'processing', 'completed', 'failed')),
  summary_status    TEXT        NOT NULL DEFAULT 'not_started'
                                CHECK (summary_status IN ('not_started', 'processing', 'completed', 'failed')),

  -- App context metadata
  platform          TEXT,       -- 'ios' | 'android'
  app_version       TEXT,       -- e.g. '1.2.0'

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index: look up submissions by user
CREATE INDEX idx_feedback_submissions_user_id
  ON public.feedback_submissions(user_id);

-- Index: find unprocessed voice rows quickly
CREATE INDEX idx_feedback_submissions_transcript_status
  ON public.feedback_submissions(transcript_status)
  WHERE submission_type = 'voice' AND audio_path IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. Row Level Security for feedback_submissions
-- ---------------------------------------------------------------------------

ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own submissions
CREATE POLICY "Users can insert own feedback"
  ON public.feedback_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own submissions
CREATE POLICY "Users can read own feedback"
  ON public.feedback_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role (Edge Function) can read and update everything
-- Service role bypasses RLS automatically — no extra policy needed.

COMMENT ON TABLE public.feedback_submissions IS
  'Raw feedback records submitted by VEN App users. '
  'Voice audio is stored in the feedback-audio private bucket. '
  'AI processing results are in feedback_ai_results.';
