-- ============================================================
-- Story like / repost notifications
--
-- Extends public.notifications with two story-scoped kinds, mirrored by AFTER
-- triggers on the source tables (same pattern as the follow / message / view
-- triggers in 20260614200000_create_notifications):
--   * story_likes  INSERT -> 'story_like'   (the story author)   | DELETE -> remove
--   * stories      INSERT (is_repost) -> 'story_repost' (the *original* author) |
--                  DELETE (is_repost) -> remove
--
-- Unlike the other kinds, story notifications are NOT collapsed to one row per
-- recipient: each distinct liker / reposter keeps its own row so the app can
-- render "A, B and N others liked your story". They are grouped per
-- (recipient, story, kind) at read time (see lib/users/notifications.ts).
--
-- A self-action (liking / reposting your own story) is skipped so it never trips
-- the `no_self_notification` CHECK. Each event also pings the recipient's
-- `home-stats:<id>` channel so the unread badge updates live (the badge counts
-- grouped story notifications, recomputed server-side on each ping).
-- ============================================================

-- ---- Widen the kind CHECK ----------------------------------
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check
    CHECK (kind IN ('follow', 'message', 'profile_view', 'story_like', 'story_repost'));

-- ---- Story reference (CASCADE so a deleted story prunes its notifications) ---
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.notifications.story_id IS
    'Set for story_like / story_repost — the story the recipient should open.';

-- ---- Collapse index: one row per (recipient, actor, story, kind) ------------
-- Backs the ON CONFLICT bump in the triggers below (a re-like resurfaces the
-- existing row instead of inserting a duplicate).
CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_story
    ON public.notifications (user_id, actor_id, story_id, kind)
    WHERE kind IN ('story_like', 'story_repost');

-- ---- Trigger fns -------------------------------------------
-- SECURITY DEFINER with an empty search_path, like the other notification
-- triggers (they write the deny-all table and the private channel regardless of
-- the actor's RLS; table / realtime refs are fully qualified).

CREATE OR REPLACE FUNCTION public.persist_notification_on_story_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    story_author uuid;
BEGIN
    SELECT author_id INTO story_author
      FROM public.stories WHERE id = NEW.story_id;

    -- Story gone, or the author liked their own story: nothing to notify.
    IF story_author IS NULL OR story_author = NEW.liker_id THEN
        RETURN NULL;
    END IF;

    INSERT INTO public.notifications (user_id, actor_id, kind, story_id)
    VALUES (story_author, NEW.liker_id, 'story_like', NEW.story_id)
    ON CONFLICT (user_id, actor_id, story_id, kind)
        WHERE kind IN ('story_like', 'story_repost')
    DO UPDATE SET created_at = now(), read_at = NULL;

    PERFORM realtime.send(
        jsonb_build_object('reason', 'story_like'),
        'stats:refresh',
        'home-stats:' || story_author::text,
        true
    );
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_notification_on_story_unlike()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    story_author uuid;
BEGIN
    DELETE FROM public.notifications
     WHERE kind = 'story_like'
       AND story_id = OLD.story_id
       AND actor_id = OLD.liker_id;

    -- Best-effort live badge refresh (no-op topic if the story is gone).
    SELECT author_id INTO story_author
      FROM public.stories WHERE id = OLD.story_id;
    IF story_author IS NOT NULL THEN
        PERFORM realtime.send(
            jsonb_build_object('reason', 'story_like'),
            'stats:refresh',
            'home-stats:' || story_author::text,
            true
        );
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.persist_notification_on_story_repost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Only reposts of a known original story / author can be notified; a repost
    -- of one's own story (guarded by the API) is skipped to honour the CHECK.
    IF NOT NEW.is_repost
       OR NEW.original_story_id IS NULL
       OR NEW.original_author_id IS NULL
       OR NEW.original_author_id = NEW.author_id THEN
        RETURN NULL;
    END IF;

    INSERT INTO public.notifications (user_id, actor_id, kind, story_id)
    VALUES (NEW.original_author_id, NEW.author_id, 'story_repost', NEW.original_story_id)
    ON CONFLICT (user_id, actor_id, story_id, kind)
        WHERE kind IN ('story_like', 'story_repost')
    DO UPDATE SET created_at = now(), read_at = NULL;

    PERFORM realtime.send(
        jsonb_build_object('reason', 'story_repost'),
        'stats:refresh',
        'home-stats:' || NEW.original_author_id::text,
        true
    );
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_notification_on_story_unrepost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT OLD.is_repost
       OR OLD.original_story_id IS NULL
       OR OLD.original_author_id IS NULL THEN
        RETURN NULL;
    END IF;

    DELETE FROM public.notifications
     WHERE kind = 'story_repost'
       AND story_id = OLD.original_story_id
       AND actor_id = OLD.author_id
       AND user_id = OLD.original_author_id;

    PERFORM realtime.send(
        jsonb_build_object('reason', 'story_repost'),
        'stats:refresh',
        'home-stats:' || OLD.original_author_id::text,
        true
    );
    RETURN NULL;
END;
$$;

-- ---- Triggers ----------------------------------------------

CREATE TRIGGER trg_persist_notification_story_like_insert
    AFTER INSERT ON public.story_likes
    FOR EACH ROW EXECUTE FUNCTION public.persist_notification_on_story_like();

CREATE TRIGGER trg_persist_notification_story_like_delete
    AFTER DELETE ON public.story_likes
    FOR EACH ROW EXECUTE FUNCTION public.remove_notification_on_story_unlike();

CREATE TRIGGER trg_persist_notification_story_repost_insert
    AFTER INSERT ON public.stories
    FOR EACH ROW EXECUTE FUNCTION public.persist_notification_on_story_repost();

CREATE TRIGGER trg_persist_notification_story_repost_delete
    AFTER DELETE ON public.stories
    FOR EACH ROW EXECUTE FUNCTION public.remove_notification_on_story_unrepost();
