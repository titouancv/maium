-- ============================================================
-- Profile views: count distinct viewers, not raw view-days
--
-- The home "profile views (7d)" stat should report how many *distinct people*
-- viewed the profile over the window, not the number of (viewer, day) rows. A
-- viewer who came back on several days previously counted multiple times; with
-- COUNT(DISTINCT viewer_id) they count once. Rows stay deduped per day, so this
-- is purely a read-side change. CREATE OR REPLACE preserves the existing grants.
-- ============================================================

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
    SELECT COUNT(DISTINCT viewer_id)::integer
    FROM public.profile_views
    WHERE profile_id = p_user_id
      AND created_at >= p_since;
$$;
