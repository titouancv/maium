-- ============================================================
-- Embed each own story's viewers directly into the feed RPC.
--
-- The viewers list used to be fetched lazily, per story, on the reader open
-- (GET /api/stories/:id/viewers -> get_story_viewers). That made it slow to
-- appear and re-fetched on every navigation. Since viewers are only ever shown
-- on the caller's *own* stories — already part of the feed — we fold them into
-- get_stories_feed as a jsonb array, carried alongside the story it belongs to.
-- The feed now arrives complete: viewers paint instantly, fetched once with the
-- story. The standalone get_story_viewers RPC is no longer needed and is dropped.
--
-- The viewers array is only populated for rows the caller authors (matching the
-- author-only authorization the dropped RPC enforced); every other row carries
-- an empty array, so no follower ever leaks another author's viewers.
-- ============================================================

-- Adding the `viewers` column changes the function's return type, which
-- CREATE OR REPLACE cannot do (Postgres 42P13) — drop it first, then recreate.
DROP FUNCTION IF EXISTS public.get_stories_feed();

CREATE FUNCTION public.get_stories_feed()
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
    reposted_by_me              boolean,
    viewers                     jsonb
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
        ),
        -- Viewers, author-only: who saw this story (excluding the author),
        -- most-recent-first, each flagged with whether they also liked/reposted
        -- it. Empty array on stories the caller doesn't author.
        CASE
            WHEN s.author_id = auth.uid() THEN (
                SELECT COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            'pseudo', vu.pseudo,
                            'first_name', vu.first_name,
                            'last_name', vu.last_name,
                            'location', vu.location,
                            'liked', EXISTS (
                                SELECT 1 FROM public.story_likes l
                                WHERE l.story_id = s.id
                                  AND l.liker_id = v.viewer_id
                            ),
                            'reposted', EXISTS (
                                SELECT 1 FROM public.stories r
                                WHERE r.is_repost
                                  AND r.original_story_id = s.id
                                  AND r.author_id = v.viewer_id
                            )
                        )
                        ORDER BY v.created_at DESC
                    ),
                    '[]'::jsonb
                )
                FROM public.story_views v
                JOIN public.users vu ON vu.id = v.viewer_id
                WHERE v.story_id = s.id
                  AND v.viewer_id <> auth.uid()
            )
            ELSE '[]'::jsonb
        END
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

-- The viewers list now ships with the feed; the standalone RPC is dead.
DROP FUNCTION IF EXISTS public.get_story_viewers(uuid);
