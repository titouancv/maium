-- ============================================================
-- Stories read RPCs — fold the feed and the viewers list into single,
-- self-contained SECURITY DEFINER functions.
--
-- Both paths previously fanned out into several queries and reached for the
-- service-role client to read rows RLS hides (global like/repost totals; other
-- users' story_views and their user summaries). With the counts now denormalized
-- onto `stories` (see 20260614100000), the remaining cross-RLS reads collapse
-- into one function each, and the service-role client leaves the stories read
-- path entirely.
--
-- Each function re-derives the caller from auth.uid() (resolved from the request
-- JWT, which still works under SECURITY DEFINER) and re-applies the visibility /
-- ownership rules the RLS policies enforce.
-- ============================================================

-- ---- Feed: visible, non-expired stories for the caller -----
-- Mirrors the `stories` SELECT RLS policy (own + followed authors) plus the 24h
-- expiry filter, returning each story flat with its author + original-author
-- summary, the caller's seen/liked/reposted flags, and the denormalized counts.
-- Stories come oldest-first; grouping/ordering by author is done in app code.
CREATE OR REPLACE FUNCTION public.get_stories_feed()
RETURNS TABLE (
    id                          uuid,
    author_id                   uuid,
    content                     text,
    is_repost                   boolean,
    original_author_id          uuid,
    original_story_id           uuid,
    created_at                  timestamptz,
    like_count                  integer,
    repost_count                integer,
    author_pseudo               text,
    author_first_name           text,
    author_last_name            text,
    author_location             text,
    original_author_pseudo      text,
    original_author_first_name  text,
    original_author_last_name   text,
    seen                        boolean,
    liked_by_me                 boolean,
    reposted_by_me              boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        s.id,
        s.author_id,
        s.content,
        s.is_repost,
        s.original_author_id,
        s.original_story_id,
        s.created_at,
        s.like_count,
        s.repost_count,
        a.pseudo,
        a.first_name,
        a.last_name,
        a.location,
        oa.pseudo,
        oa.first_name,
        oa.last_name,
        EXISTS (
            SELECT 1 FROM public.story_views v
            WHERE v.story_id = s.id AND v.viewer_id = auth.uid()
        ),
        EXISTS (
            SELECT 1 FROM public.story_likes l
            WHERE l.story_id = s.id AND l.liker_id = auth.uid()
        ),
        EXISTS (
            SELECT 1 FROM public.stories r
            WHERE r.is_repost
              AND r.original_story_id = s.id
              AND r.author_id = auth.uid()
        )
    FROM public.stories s
    JOIN public.users a ON a.id = s.author_id
    LEFT JOIN public.users oa ON oa.id = s.original_author_id
    WHERE s.expires_at > now()
      AND (
          s.author_id = auth.uid()
          OR EXISTS (
              SELECT 1 FROM public.user_follows f
              WHERE f.follower_id = auth.uid()
                AND f.followed_id = s.author_id
          )
      )
    ORDER BY s.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_stories_feed() TO authenticated;

-- ---- Viewers: who saw one of the caller's own stories ------
-- Only the story's author may read its viewers. Returns each viewer (excluding
-- the author) most-recent-first, flagged with whether they also liked/reposted
-- it. Raises insufficient_privilege (SQLSTATE 42501, surfaced by PostgREST as
-- HTTP 403) when the caller is not the author or the story does not exist.
CREATE OR REPLACE FUNCTION public.get_story_viewers(p_story_id uuid)
RETURNS TABLE (
    pseudo      text,
    first_name  text,
    last_name   text,
    location    text,
    liked       boolean,
    reposted    boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.stories s
        WHERE s.id = p_story_id AND s.author_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'not the author of this story'
            USING errcode = 'insufficient_privilege';
    END IF;

    RETURN QUERY
    SELECT
        u.pseudo,
        u.first_name,
        u.last_name,
        u.location,
        EXISTS (
            SELECT 1 FROM public.story_likes l
            WHERE l.story_id = p_story_id AND l.liker_id = v.viewer_id
        ),
        EXISTS (
            SELECT 1 FROM public.stories r
            WHERE r.is_repost
              AND r.original_story_id = p_story_id
              AND r.author_id = v.viewer_id
        )
    FROM public.story_views v
    JOIN public.users u ON u.id = v.viewer_id
    WHERE v.story_id = p_story_id
      AND v.viewer_id <> auth.uid()
    ORDER BY v.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_story_viewers(uuid) TO authenticated;
