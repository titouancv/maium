-- ============================================================
-- Drop the Stories feature
--
-- Stories were a social feed grafted onto a job-matching product; the app is
-- refocusing on the offer↔profile analysis, so the whole feature goes: tables,
-- RPCs, notification kinds and their triggers.
--
-- Order matters:
--   1. detach public.notifications from public.stories (drop story_id, which
--      takes its FK and partial unique index with it) and narrow the kind CHECK
--   2. drop the RPCs
--   3. drop the tables — this also drops every trigger defined on them
--   4. drop the now-orphaned trigger functions (no CASCADE needed)
--
-- `public.stories` was never added to the `supabase_realtime` publication
-- (only `messages` and `analysis_jobs` are), so there is nothing to detach.
-- ============================================================

-- ---- 1. public.notifications: back to three kinds -----------
-- Purge the story rows first: the narrowed CHECK below is validated against
-- existing data.
DELETE FROM public.notifications WHERE kind IN ('story_like', 'story_repost');

-- Dropping the column also drops its FK to public.stories and the partial
-- unique index uq_notifications_story that covered it.
ALTER TABLE public.notifications DROP COLUMN IF EXISTS story_id;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check
    CHECK (kind IN ('follow', 'message', 'profile_view'));

COMMENT ON TABLE public.notifications IS
    'Persistent per-user notifications (follow / message / profile_view), one row per actor (per conversation for messages).';

-- ---- 2. RPCs ------------------------------------------------
DROP FUNCTION IF EXISTS public.get_stories_feed();
DROP FUNCTION IF EXISTS public.get_story_viewers(uuid);

-- ---- 3. Tables (drops their triggers along the way) ---------
-- story_likes / story_views reference stories, so drop them first and no
-- CASCADE is needed anywhere — nothing else can be taken down by accident.
DROP TABLE IF EXISTS public.story_likes;
DROP TABLE IF EXISTS public.story_views;
DROP TABLE IF EXISTS public.stories;

-- ---- 4. Orphaned trigger functions --------------------------
DROP FUNCTION IF EXISTS public.persist_notification_on_story_like();
DROP FUNCTION IF EXISTS public.remove_notification_on_story_unlike();
DROP FUNCTION IF EXISTS public.persist_notification_on_story_repost();
DROP FUNCTION IF EXISTS public.remove_notification_on_story_unrepost();
DROP FUNCTION IF EXISTS public.broadcast_notification_on_story_like();
DROP FUNCTION IF EXISTS public.broadcast_notification_on_story_repost();
DROP FUNCTION IF EXISTS public.sync_story_like_count();
DROP FUNCTION IF EXISTS public.sync_story_repost_count();
