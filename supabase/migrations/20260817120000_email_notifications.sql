ALTER TABLE public.users
    ADD COLUMN email_notifications boolean NOT NULL DEFAULT true,
    ADD COLUMN locale text NOT NULL DEFAULT 'en'
        CHECK (locale IN ('en', 'fr'));

ALTER TABLE public.notifications
    ADD COLUMN emailed_at timestamptz;

CREATE INDEX idx_notifications_email_pending
    ON public.notifications (created_at)
    WHERE emailed_at IS NULL AND read_at IS NULL;

CREATE FUNCTION public.sweep_stale_analysis_notifications_all()
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    DELETE FROM public.notifications n
     USING public.analyses a
     WHERE n.kind = 'analysis_snooze'
       AND n.analysis_id = a.id
       AND (a.snooze_days IS NULL
            OR a.status IN ('rejected', 'accepted')
            OR n.created_at < coalesce(a.status_changed_at, a.created_at));

    INSERT INTO public.notifications (user_id, analysis_id, kind)
    SELECT a.user_id, a.id, 'analysis_snooze'
      FROM public.analyses a
     WHERE a.user_id IS NOT NULL
       AND a.snooze_days IS NOT NULL
       AND a.status NOT IN ('rejected', 'accepted')
       AND coalesce(a.status_changed_at, a.created_at)
           < now() - make_interval(days => a.snooze_days)
    ON CONFLICT (user_id, analysis_id) WHERE kind = 'analysis_snooze'
    DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sweep_stale_analysis_notifications_all()
    FROM public, anon, authenticated;
