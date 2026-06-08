-- ============================================================
-- Profile views — who viewed whose profile, deduped per day
--
-- Powers the home dashboard "profile views (last 7 days)" stat. We store one
-- row per (profile, viewer, day), so a viewer refreshing a profile many times
-- the same day only ever adds one row. Only authenticated viewers are
-- recorded, and self-views are forbidden.
-- ============================================================

CREATE TABLE public.profile_views (
    id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profile_id  uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    viewer_id   uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    viewed_on   date        NOT NULL DEFAULT current_date,
    created_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT no_self_view CHECK (viewer_id <> profile_id)
);

COMMENT ON TABLE public.profile_views IS
    'One row per (profile, viewer, day): unique daily profile viewers, used for the home "profile views (7d)" stat.';
COMMENT ON COLUMN public.profile_views.profile_id IS 'The user whose profile was viewed.';
COMMENT ON COLUMN public.profile_views.viewer_id IS 'The authenticated user who viewed the profile.';

-- One view per viewer per profile per day (drives dedup via INSERT .. on 23505).
CREATE UNIQUE INDEX uq_profile_views_daily
    ON public.profile_views (profile_id, viewer_id, viewed_on);

-- Trend/count queries always filter by profile + time window.
CREATE INDEX idx_profile_views_profile_created
    ON public.profile_views (profile_id, created_at);

-- ---- RLS ----------------------------------------------------
-- Locked down: rows are written only by the service-role client (the API route)
-- and read only via the SECURITY DEFINER RPC below / the service-role client.
-- No direct client access, so RLS is enabled with no policies (deny all).
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- ---- RPC: profile views over a window ----------------------
-- Counts view rows for one profile since `p_since`. Called server-side with the
-- already-authenticated user's id (the admin client has no JWT, so we can't
-- rely on auth.uid() here).

CREATE OR REPLACE FUNCTION public.get_profile_views_count(
    p_user_id uuid,
    p_since   timestamptz
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COUNT(*)::integer
    FROM public.profile_views
    WHERE profile_id = p_user_id
      AND created_at >= p_since;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_views_count(uuid, timestamptz)
    TO authenticated, service_role;
