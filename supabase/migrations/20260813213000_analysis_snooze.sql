ALTER TABLE public.analyses
    ADD COLUMN snooze_days int
        CHECK (snooze_days IS NULL OR snooze_days > 0);

CREATE INDEX idx_analyses_snoozed
    ON public.analyses (user_id) WHERE snooze_days IS NOT NULL;

ALTER TABLE public.notifications
    ADD COLUMN analysis_id uuid REFERENCES public.analyses(id) ON DELETE CASCADE,
    ALTER COLUMN actor_id DROP NOT NULL;

ALTER TABLE public.notifications
    DROP CONSTRAINT IF EXISTS notifications_kind_check;

ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_kind_check
        CHECK (kind IN ('follow', 'message', 'profile_view', 'analysis_snooze'));

ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_analysis_snooze_targets_analysis
        CHECK ((kind = 'analysis_snooze') = (analysis_id IS NOT NULL));

ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_actor_required_unless_system
        CHECK (actor_id IS NOT NULL OR kind = 'analysis_snooze');

CREATE UNIQUE INDEX uq_notifications_analysis_snooze
    ON public.notifications (user_id, analysis_id) WHERE kind = 'analysis_snooze';

CREATE FUNCTION public.sweep_stale_analysis_notifications(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    DELETE FROM public.notifications n
     USING public.analyses a
     WHERE n.kind = 'analysis_snooze'
       AND n.user_id = p_user_id
       AND n.analysis_id = a.id
       AND (a.snooze_days IS NULL
            OR a.status IN ('rejected', 'accepted')
            OR n.created_at < coalesce(a.status_changed_at, a.created_at));

    INSERT INTO public.notifications (user_id, analysis_id, kind)
    SELECT a.user_id, a.id, 'analysis_snooze'
      FROM public.analyses a
     WHERE a.user_id = p_user_id
       AND a.snooze_days IS NOT NULL
       AND a.status NOT IN ('rejected', 'accepted')
       AND coalesce(a.status_changed_at, a.created_at)
           < now() - make_interval(days => a.snooze_days)
    ON CONFLICT (user_id, analysis_id) WHERE kind = 'analysis_snooze'
    DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sweep_stale_analysis_notifications(uuid)
    FROM public, anon, authenticated;
