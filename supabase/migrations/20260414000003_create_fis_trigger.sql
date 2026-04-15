-- =============================================================================
-- VEN Feedback Intelligence Service (FIS)
-- Migration 003: Database trigger → Edge Function via pg_net
-- Safer version: uses FIS_WEBHOOK_SECRET instead of legacy service_role key
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fis_trigger_voice_processing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_url      TEXT;
  v_webhook_secret   TEXT;
  v_function_url     TEXT;
  v_payload          JSONB;
  v_request_id       BIGINT;
BEGIN
  -- Only process voice submissions that have an audio file
  IF NEW.submission_type <> 'voice' OR NEW.audio_path IS NULL THEN
    RETURN NEW;
  END IF;

  -- Read secrets from Supabase Vault
  SELECT decrypted_secret INTO v_project_url
    FROM vault.decrypted_secrets
    WHERE name = 'SUPABASE_PROJECT_URL'
    LIMIT 1;

  SELECT decrypted_secret INTO v_webhook_secret
    FROM vault.decrypted_secrets
    WHERE name = 'FIS_WEBHOOK_SECRET'
    LIMIT 1;

  IF v_project_url IS NULL OR v_webhook_secret IS NULL THEN
    RAISE WARNING '[FIS] Missing vault secrets SUPABASE_PROJECT_URL or FIS_WEBHOOK_SECRET — skipping trigger for submission %', NEW.id;
    RETURN NEW;
  END IF;

  v_function_url := v_project_url || '/functions/v1/process-feedback-voice';

  -- Build the payload
  v_payload := jsonb_build_object(
    'submission_id',  NEW.id,
    'audio_path',     NEW.audio_path,
    'user_id',        NEW.user_id,
    'source_screen',  NEW.source_screen,
    'task_area',      NEW.task_area,
    'feeling',        NEW.feeling,
    'message_text',   NEW.message_text
  );

  -- Fire async HTTP call with custom webhook secret
  SELECT net.http_post(
    url     := v_function_url,
    headers := jsonb_build_object(
      'Content-Type',       'application/json',
      'x-fis-webhook-secret', v_webhook_secret
    ),
    body    := v_payload
  ) INTO v_request_id;

  RAISE LOG '[FIS] Triggered process-feedback-voice for submission %, pg_net request_id=%',
    NEW.id, v_request_id;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Never block the user's INSERT
  RAISE WARNING '[FIS] Trigger error for submission %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fis_voice_processing_trigger ON public.feedback_submissions;

CREATE TRIGGER fis_voice_processing_trigger
  AFTER INSERT
  ON public.feedback_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.fis_trigger_voice_processing();

COMMENT ON FUNCTION public.fis_trigger_voice_processing() IS
  'Fires after each INSERT on feedback_submissions. If the row is a voice submission with an audio_path, it calls the process-feedback-voice Edge Function asynchronously via pg_net using a custom webhook secret. Never blocks the original INSERT.';
