ALTER TABLE public.analyses
    ADD COLUMN status_changed_at timestamptz;

UPDATE public.analyses a
SET status_changed_at = e.created_at
FROM (
    SELECT DISTINCT ON (analysis_id) analysis_id, created_at
    FROM public.analysis_status_events
    ORDER BY analysis_id, created_at DESC
) e
WHERE e.analysis_id = a.id;

UPDATE public.analyses
SET status_changed_at = coalesce(interview_at, applied_at)
WHERE status_changed_at IS NULL
  AND status <> 'not_started'
  AND coalesce(interview_at, applied_at) IS NOT NULL;

DROP TRIGGER analyses_log_status_event ON public.analyses;
DROP FUNCTION public.log_analysis_status_event();
DROP TABLE public.analysis_status_events;

ALTER TABLE public.analyses
    DROP COLUMN applied_at,
    DROP COLUMN interview_at;

CREATE FUNCTION public.touch_analysis_status_changed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.status_changed_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER analyses_touch_status_changed_at
    BEFORE UPDATE OF status ON public.analyses
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.touch_analysis_status_changed_at();
