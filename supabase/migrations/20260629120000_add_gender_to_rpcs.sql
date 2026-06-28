-- Surface each user's gender through the summary-returning RPCs so default
-- avatars in the suggestions list and the stories feed (author) can pick a
-- gendered default photo (even photos for male, odd for female). Recreated from
-- their latest definitions (20260618120200), with gender added.

-- ── Suggested users ─────────────────────────────────────────────────────────
-- Adding gender changes the return type, which CREATE OR REPLACE cannot do
-- (Postgres 42P13) — drop first, then recreate.
drop function if exists public.get_suggested_users(int);

create function public.get_suggested_users(p_limit int default 12)
returns table (
  pseudo          text,
  first_name      text,
  last_name       text,
  location        text,
  profile_photo   text,
  gender          text,
  followers_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    u.pseudo,
    u.first_name,
    u.last_name,
    u.location,
    u.profile_photo,
    u.gender,
    count(f.follower_id) as followers_count
  from public.users u
  left join public.user_follows f on f.followed_id = u.id
  where u.onboarding_completed = true
    and u.id is distinct from auth.uid()
    and not exists (
      select 1
      from public.user_follows uf
      where uf.follower_id = auth.uid()
        and uf.followed_id = u.id
    )
  group by u.id
  order by followers_count desc, u.created_at desc
  limit p_limit;
$$;

grant execute on function public.get_suggested_users(int) to anon;

-- ── Stories feed ────────────────────────────────────────────────────────────
-- Adding a column changes the return type, which CREATE OR REPLACE cannot do
-- (Postgres 42P13) — drop first, then recreate.
DROP FUNCTION IF EXISTS public.get_stories_feed();

CREATE FUNCTION public.get_stories_feed()
RETURNS TABLE (
    id                            uuid,
    author_id                     uuid,
    content                       text,
    is_repost                     boolean,
    original_author_id            uuid,
    original_story_id             uuid,
    created_at                    timestamptz,
    like_count                    integer,
    repost_count                  integer,
    author_pseudo                 text,
    author_first_name             text,
    author_last_name              text,
    author_location               text,
    author_profile_photo          text,
    author_gender                 text,
    original_author_pseudo        text,
    original_author_first_name    text,
    original_author_last_name     text,
    original_author_profile_photo text,
    seen                          boolean,
    liked_by_me                   boolean,
    reposted_by_me                boolean,
    viewers                       jsonb
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
        a.profile_photo,
        a.gender,
        oa.pseudo,
        oa.first_name,
        oa.last_name,
        oa.profile_photo,
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
                            'profile_photo', vu.profile_photo,
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
