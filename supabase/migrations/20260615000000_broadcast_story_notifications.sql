-- ============================================================
-- Realtime story like / repost toasts
--
-- Companion to 20260614210000_story_notifications (which persists + groups the
-- notifications). This adds the *transient* toast: a single `notify` broadcast
-- on the recipient's private `notifications:<user_id>` channel — the same
-- channel and payload shape used by broadcast_user_notifications for follows /
-- messages, so the existing NotificationsRealtime listener renders it.
--
--   * story_likes INSERT -> the story author gets
--       { kind: 'story_like',   actor_name, story_id }
--   * stories     INSERT (is_repost) -> the *original* author gets
--       { kind: 'story_repost', actor_name, story_id }   (story_id = the original)
--
-- Toasts are per-event (not grouped like the notifications card). A self-action
-- is skipped. SECURITY DEFINER + empty search_path, like the sibling triggers.
-- The receive-side RLS policy on realtime.messages already exists (see
-- 20260610120000_broadcast_user_notifications) — both channels are
-- `notifications:<their uid>`.
-- ============================================================

CREATE OR REPLACE FUNCTION public.broadcast_notification_on_story_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    story_author uuid;
    actor_name   text;
BEGIN
    SELECT author_id INTO story_author
      FROM public.stories WHERE id = NEW.story_id;

    -- Story gone, or the author liked their own story: nothing to surface.
    IF story_author IS NULL OR story_author = NEW.liker_id THEN
        RETURN NULL;
    END IF;

    SELECT COALESCE(NULLIF(u.first_name, ''), u.pseudo)
      INTO actor_name
      FROM public.users u
     WHERE u.id = NEW.liker_id;

    PERFORM realtime.send(
        jsonb_build_object(
            'kind', 'story_like',
            'actor_name', actor_name,
            'story_id', NEW.story_id::text
        ),
        'notify',
        'notifications:' || story_author::text,
        true
    );
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.broadcast_notification_on_story_repost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    actor_name text;
BEGIN
    -- Only reposts of a known original story / author; self-reposts skipped.
    IF NOT NEW.is_repost
       OR NEW.original_story_id IS NULL
       OR NEW.original_author_id IS NULL
       OR NEW.original_author_id = NEW.author_id THEN
        RETURN NULL;
    END IF;

    SELECT COALESCE(NULLIF(u.first_name, ''), u.pseudo)
      INTO actor_name
      FROM public.users u
     WHERE u.id = NEW.author_id;

    PERFORM realtime.send(
        jsonb_build_object(
            'kind', 'story_repost',
            'actor_name', actor_name,
            'story_id', NEW.original_story_id::text
        ),
        'notify',
        'notifications:' || NEW.original_author_id::text,
        true
    );
    RETURN NULL;
END;
$$;

-- ---- Triggers ----------------------------------------------

CREATE TRIGGER trg_broadcast_notification_story_like_insert
    AFTER INSERT ON public.story_likes
    FOR EACH ROW EXECUTE FUNCTION public.broadcast_notification_on_story_like();

CREATE TRIGGER trg_broadcast_notification_story_repost_insert
    AFTER INSERT ON public.stories
    FOR EACH ROW EXECUTE FUNCTION public.broadcast_notification_on_story_repost();
