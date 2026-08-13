ALTER TABLE public.analyses
    ADD COLUMN prep_points         jsonb NOT NULL DEFAULT '[]',
    ADD COLUMN recruiter_questions jsonb NOT NULL DEFAULT '[]';

UPDATE public.analyses
SET prep_points = (
        SELECT coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'title', left(point, 80),
                    'detail', point,
                    'kind', 'technical',
                    'resource_query', left(point, 60),
                    'resource_kind', 'video'
                )
            ),
            '[]'::jsonb
        )
        FROM jsonb_array_elements_text(recommendations || weaknesses) AS point
    )
WHERE jsonb_array_length(recommendations) + jsonb_array_length(weaknesses) > 0;

ALTER TABLE public.analyses
    DROP COLUMN strengths,
    DROP COLUMN weaknesses,
    DROP COLUMN missing_skills,
    DROP COLUMN recommendations;

ALTER TABLE public.analyses
    ADD COLUMN status text NOT NULL DEFAULT 'not_started'
        CHECK (status IN ('not_started', 'applied', 'interview', 'rejected', 'accepted')),
    ADD COLUMN applied_at   timestamptz,
    ADD COLUMN interview_at timestamptz,
    ADD COLUMN notes        text;

CREATE INDEX idx_analyses_user_status
    ON public.analyses (user_id, status, created_at DESC);

CREATE TABLE public.analysis_status_events (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id uuid        NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    status      text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analysis_status_events_analysis
    ON public.analysis_status_events (analysis_id, created_at DESC);

ALTER TABLE public.analysis_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own analysis status events"
    ON public.analysis_status_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.analyses a
            WHERE a.id = analysis_id AND a.user_id = auth.uid()
        )
    );

CREATE FUNCTION public.log_analysis_status_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.analysis_status_events (analysis_id, status)
    VALUES (NEW.id, NEW.status);
    RETURN NEW;
END;
$$;

CREATE TRIGGER analyses_log_status_event
    AFTER UPDATE OF status ON public.analyses
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.log_analysis_status_event();

CREATE FUNCTION public.normalize_company(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT regexp_replace(
        lower(regexp_replace(coalesce(value, ''), '[^a-zA-Z0-9]', '', 'g')),
        '(inc|llc|ltd|limited|sas|sarl|sa|gmbh|bv|corp|corporation)$',
        ''
    );
$$;

CREATE INDEX idx_user_experiences_company
    ON public.user_experiences (public.normalize_company(organization));

CREATE FUNCTION public.get_company_contacts(p_company text, p_limit int DEFAULT 8)
RETURNS TABLE (
    pseudo        text,
    first_name    text,
    last_name     text,
    location      text,
    profile_photo text,
    gender        text,
    role          text,
    start_period  bigint,
    end_period    bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT c.pseudo, c.first_name, c.last_name, c.location, c.profile_photo,
           c.gender, c.role, c.start_period, c.end_period
    FROM (
        SELECT DISTINCT ON (u.id)
            u.pseudo, u.first_name, u.last_name, u.location, u.profile_photo,
            u.gender, e.role, e.start_period, e.end_period
        FROM public.user_experiences e
        JOIN public.users u ON u.id = e.user_id
        WHERE e.type = 'professional'
          AND u.onboarding_completed
          AND u.id IS DISTINCT FROM auth.uid()
          AND public.normalize_company(p_company) <> ''
          AND public.normalize_company(e.organization) = public.normalize_company(p_company)
        ORDER BY u.id, (e.end_period IS NULL) DESC, e.end_period DESC
    ) c
    ORDER BY (c.end_period IS NULL) DESC, c.end_period DESC NULLS LAST
    LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_contacts(text, int) TO authenticated;
