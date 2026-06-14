-- ============================================================
-- Persistent user notifications
--
-- Backs the home dashboard "Notifications" card + overlay. One row per
-- recipient/actor (per conversation for messages), so the list stays compact:
-- repeated events of the same kind collapse onto a single row that "bumps" back
-- to the top and becomes unread again (read_at -> NULL).
--
-- Three notifiable events, all mirrored here by AFTER triggers on the source
-- tables (the same events the broadcast_user_notifications / broadcast_home_stats
-- migrations already react to):
--   * user_follows  INSERT -> 'follow'        (the followed user)   | DELETE -> remove
--   * messages      INSERT -> 'message'        (other conv members)
--   * profile_views INSERT -> 'profile_view'   (the viewed user)
--
-- Modelled on public.profile_views: RLS is enabled with NO policies (deny-all).
-- Rows are written only by the SECURITY DEFINER triggers below and read /
-- mark-read only via the service-role client (see lib/users/notifications.ts).
-- ============================================================

CREATE TABLE public.notifications (
    id              bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    actor_id        uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    kind            text        NOT NULL CHECK (kind IN ('follow', 'message', 'profile_view')),
    conversation_id uuid        REFERENCES public.conversations(id) ON DELETE CASCADE,
    read_at         timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT no_self_notification CHECK (actor_id <> user_id)
);

COMMENT ON TABLE public.notifications IS
    'Persistent per-user notifications (follow / message / profile_view), one row per actor (per conversation for messages).';
COMMENT ON COLUMN public.notifications.user_id IS 'Recipient of the notification.';
COMMENT ON COLUMN public.notifications.actor_id IS 'User who triggered it (follower / sender / viewer).';
COMMENT ON COLUMN public.notifications.read_at IS 'NULL while unread; set when the recipient opens the notifications overlay.';

-- ---- Collapse indexes --------------------------------------
-- One follow / profile_view notification per (recipient, actor); one message
-- notification per (recipient, conversation). These partial unique indexes also
-- back the ON CONFLICT upserts in the triggers below.
CREATE UNIQUE INDEX uq_notifications_follow
    ON public.notifications (user_id, actor_id) WHERE kind = 'follow';
CREATE UNIQUE INDEX uq_notifications_profile_view
    ON public.notifications (user_id, actor_id) WHERE kind = 'profile_view';
CREATE UNIQUE INDEX uq_notifications_message
    ON public.notifications (user_id, conversation_id) WHERE kind = 'message';

-- Listing (newest first) and the unread-count badge.
CREATE INDEX idx_notifications_user_created
    ON public.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread
    ON public.notifications (user_id) WHERE read_at IS NULL;

-- ---- RLS: deny-all (written by triggers, read via service-role) ----
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ---- Trigger fns -------------------------------------------
-- All SECURITY DEFINER with an empty search_path so they can write the deny-all
-- table regardless of the actor's RLS (table refs fully qualified). Each upsert
-- resets created_at / read_at so a repeat event resurfaces the notification.

CREATE OR REPLACE FUNCTION public.persist_notification_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, actor_id, kind)
    VALUES (NEW.followed_id, NEW.follower_id, 'follow')
    ON CONFLICT (user_id, actor_id) WHERE kind = 'follow'
    DO UPDATE SET created_at = now(), read_at = NULL;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_notification_on_unfollow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    DELETE FROM public.notifications
     WHERE user_id = OLD.followed_id
       AND actor_id = OLD.follower_id
       AND kind = 'follow';
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.persist_notification_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- One notification per other member of the conversation.
    INSERT INTO public.notifications (user_id, actor_id, kind, conversation_id)
    SELECT cm.user_id, NEW.sender_id, 'message', NEW.conversation_id
      FROM public.conversation_members cm
     WHERE cm.conversation_id = NEW.conversation_id
       AND cm.user_id <> NEW.sender_id
    ON CONFLICT (user_id, conversation_id) WHERE kind = 'message'
    DO UPDATE SET actor_id = EXCLUDED.actor_id, created_at = now(), read_at = NULL;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.persist_notification_on_view()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, actor_id, kind)
    VALUES (NEW.profile_id, NEW.viewer_id, 'profile_view')
    ON CONFLICT (user_id, actor_id) WHERE kind = 'profile_view'
    DO UPDATE SET created_at = now(), read_at = NULL;
    RETURN NULL;
END;
$$;

-- ---- Triggers ----------------------------------------------

CREATE TRIGGER trg_persist_notification_follow_insert
    AFTER INSERT ON public.user_follows
    FOR EACH ROW EXECUTE FUNCTION public.persist_notification_on_follow();

CREATE TRIGGER trg_persist_notification_follow_delete
    AFTER DELETE ON public.user_follows
    FOR EACH ROW EXECUTE FUNCTION public.remove_notification_on_unfollow();

CREATE TRIGGER trg_persist_notification_message_insert
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.persist_notification_on_message();

CREATE TRIGGER trg_persist_notification_view_insert
    AFTER INSERT ON public.profile_views
    FOR EACH ROW EXECUTE FUNCTION public.persist_notification_on_view();
