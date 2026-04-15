-- =============================================================================
-- VEN Feedback Intelligence Service (FIS)
-- Migration 004: Manual test helper view + test function
-- =============================================================================
--
-- This migration creates:
--   1. A view (fis_processing_status) to easily check the status of any submission
--   2. A SQL function (fis_reprocess_submission) to manually retry a failed row
--
-- These are operational helpers — not part of the core data model.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Status dashboard view
--    Join submissions + results for quick monitoring
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.fis_processing_status AS
SELECT
  s.id                  AS submission_id,
  s.user_id,
  s.submission_type,
  s.source_screen,
  s.task_area,
  s.feeling,
  s.audio_path,
  s.transcript_status,
  s.summary_status,
  s.platform,
  s.app_version,
  s.created_at          AS submitted_at,
  r.id                  AS result_id,
  r.processing_status,
  r.one_line_summary,
  r.main_issue,
  r.feature_area,
  r.sentiment,
  r.priority,
  r.needs_human_review,
  r.error_message,
  r.processed_at,
  r.model_name
FROM public.feedback_submissions s
LEFT JOIN public.feedback_ai_results r
  ON r.feedback_submission_id = s.id
ORDER BY s.created_at DESC;

COMMENT ON VIEW public.fis_processing_status IS
  'Joined view of feedback_submissions + feedback_ai_results for FIS monitoring. '
  'Query this to check processing state of any submission.';

-- ---------------------------------------------------------------------------
-- 2. Retry / reprocess function
--    Call this from SQL to manually re-trigger the Edge Function for a row.
--    Useful for: failed rows, testing, debugging.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fis_reprocess_submission(p_submission_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_url  TEXT;
  v_service_key  TEXT;
  v_function_url TEXT;
  v_payload      JSONB;
  v_request_id   BIGINT;
  v_submission   RECORD;
BEGIN
  -- Fetch the submission
  SELECT * INTO v_submission
    FROM public.feedback_submissions
    WHERE id = p_submission_id;

  IF NOT FOUND THEN
    RETURN 'ERROR: submission not found: ' || p_submission_id;
  END IF;

  IF v_submission.submission_type <> 'voice' OR v_submission.audio_path IS NULL THEN
    RETURN 'ERROR: not a voice submission with audio_path';
  END IF;

  -- Reset status flags so the function processes fresh
  UPDATE public.feedback_submissions
    SET transcript_status = 'not_started',
        summary_status    = 'not_started'
    WHERE id = p_submission_id;

  UPDATE public.feedback_ai_results
    SET processing_status = 'not_started',
        error_message     = NULL,
        processed_at      = NULL
    WHERE feedback_submission_id = p_submission_id;

  -- Read vault secrets
  SELECT decrypted_secret INTO v_project_url
    FROM vault.decrypted_secrets WHERE name = 'SUPABASE_PROJECT_URL' LIMIT 1;

  SELECT decrypted_secret INTO v_service_key
    FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;

  IF v_project_url IS NULL OR v_service_key IS NULL THEN
    RETURN 'ERROR: vault secrets missing';
  END IF;

  v_function_url := v_project_url || '/functions/v1/process-feedback-voice';

  v_payload := jsonb_build_object(
    'submission_id', v_submission.id,
    'audio_path',    v_submission.audio_path,
    'user_id',       v_submission.user_id,
    'source_screen', v_submission.source_screen,
    'task_area',     v_submission.task_area,
    'feeling',       v_submission.feeling,
    'message_text',  v_submission.message_text
  );

  SELECT net.http_post(
    url     := v_function_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body    := v_payload
  ) INTO v_request_id;

  RETURN 'OK: re-triggered submission ' || p_submission_id || ', pg_net request_id=' || v_request_id;
END;
$$;

COMMENT ON FUNCTION public.fis_reprocess_submission(UUID) IS
  'Manually re-triggers the FIS Edge Function for a voice submission. '
  'Resets status flags and fires a new pg_net HTTP call. '
  'Use for: failed rows, testing, debugging. '
  'Example: SELECT fis_reprocess_submission(''your-uuid-here'');';
