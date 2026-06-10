-- ============================================================
-- Realtime user notifications
--
-- Surfaces toast-worthy events on a *private per-user* Realtime channel
-- `notifications:<user_id>`, as a single `notify` broadcast carrying the
-- actor's display name (so the client can render "Paul vous suit" without
-- being able to read other users' rows — public.users SELECT is RLS-locked to
-- one's own row):
--
--   * user_follows INSERT -> the followed user gets
--       { kind: 'follow',   actor_name }
--   * messages      INSERT -> every *other* conversation member gets
--       { kind: 'message',  actor_name, conversation_id }
--
-- Mirrors the broadcast_home_stats triggers: SECURITY DEFINER (to read the
-- actor's name and write the private channel regardless of the actor's RLS)
-- with an empty search_path (so `realtime.send` / table refs are fully
-- qualified). The payload is the message itself — the client only renders it.
-- ============================================================

-- ---- Trigger fns -------------------------------------------

CREATE OR REPLACE FUNCTION public.broadcast_notification_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    actor_name text;
BEGIN
    SELECT COALESCE(NULLIF(u.first_name, ''), u.pseudo)
      INTO actor_name
      FROM public.users u
     WHERE u.id = NEW.follower_id;

    PERFORM realtime.send(
        jsonb_build_object('kind', 'follow', 'actor_name', actor_name),
        'notify',
        'notifications:' || NEW.followed_id::text,
        true
    );
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.broadcast_notification_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    actor_name text;
BEGIN
    SELECT COALESCE(NULLIF(u.first_name, ''), u.pseudo)
      INTO actor_name
      FROM public.users u
     WHERE u.id = NEW.sender_id;

    -- One broadcast per other member of the conversation.
    PERFORM realtime.send(
        jsonb_build_object(
            'kind', 'message',
            'actor_name', actor_name,
            'conversation_id', NEW.conversation_id::text
        ),
        'notify',
        'notifications:' || cm.user_id::text,
        true
    )
    FROM public.conversation_members cm
    WHERE cm.conversation_id = NEW.conversation_id
      AND cm.user_id <> NEW.sender_id;
    RETURN NULL;
END;
$$;

-- ---- Triggers ----------------------------------------------

CREATE TRIGGER trg_broadcast_notification_follow_insert
    AFTER INSERT ON public.user_follows
    FOR EACH ROW EXECUTE FUNCTION public.broadcast_notification_on_follow();

CREATE TRIGGER trg_broadcast_notification_message_insert
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.broadcast_notification_on_message();

-- ---- RLS: authorize receiving one's own notifications channel
-- Private Realtime channels are gated by RLS on `realtime.messages`. A user may
-- only receive broadcasts on their own `notifications:<their uid>` topic. (The
-- triggers above write via the SECURITY DEFINER `realtime.send`, which is not
-- governed by this SELECT policy.)

CREATE POLICY "Users receive their own notification broadcasts"
    ON realtime.messages
    FOR SELECT
    TO authenticated
    USING (
        realtime.messages.extension = 'broadcast'
        AND realtime.topic() = 'notifications:' || (SELECT auth.uid())::text
    );
