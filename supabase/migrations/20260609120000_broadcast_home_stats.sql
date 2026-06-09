-- ============================================================
-- Realtime home-stats broadcasts
--
-- The home dashboard stats (followers + 7d trend, profile views, unread
-- conversations) are computed server-side. To make them update live, DB
-- triggers broadcast a lightweight "refresh" ping on a *private per-user*
-- Realtime channel `home-stats:<user_id>` whenever something that affects that
-- user's counters changes:
--
--   * user_follows  INSERT/DELETE -> the followed user (follower count + trend)
--   * profile_views INSERT        -> the viewed user (profile views)
--   * messages      INSERT        -> the other conversation members (unread)
--
-- The ping carries no numbers — the client refetches the authoritative stats so
-- the server stays the single source of truth (trend nullability, distinct
-- viewers, unread logic). The channel is only a trigger to refresh.
-- ============================================================

-- ---- Trigger fns -------------------------------------------
-- All run SECURITY DEFINER so the deny-all log tables (profile_views) and the
-- private channel can be written regardless of the actor's RLS, and pin an
-- empty search_path (so `realtime.send` / table refs are fully qualified).

CREATE OR REPLACE FUNCTION public.broadcast_home_stats_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    PERFORM realtime.send(
        jsonb_build_object('reason', 'followers'),
        'stats:refresh',
        'home-stats:' || COALESCE(NEW.followed_id, OLD.followed_id)::text,
        true
    );
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.broadcast_home_stats_on_view()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    PERFORM realtime.send(
        jsonb_build_object('reason', 'profile_views'),
        'stats:refresh',
        'home-stats:' || NEW.profile_id::text,
        true
    );
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.broadcast_home_stats_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Ping every other member of the conversation (their unread count changed).
    PERFORM realtime.send(
        jsonb_build_object('reason', 'unread'),
        'stats:refresh',
        'home-stats:' || cm.user_id::text,
        true
    )
    FROM public.conversation_members cm
    WHERE cm.conversation_id = NEW.conversation_id
      AND cm.user_id <> NEW.sender_id;
    RETURN NULL;
END;
$$;

-- ---- Triggers ----------------------------------------------

CREATE TRIGGER trg_broadcast_home_stats_follow_insert
    AFTER INSERT ON public.user_follows
    FOR EACH ROW EXECUTE FUNCTION public.broadcast_home_stats_on_follow();

CREATE TRIGGER trg_broadcast_home_stats_follow_delete
    AFTER DELETE ON public.user_follows
    FOR EACH ROW EXECUTE FUNCTION public.broadcast_home_stats_on_follow();

CREATE TRIGGER trg_broadcast_home_stats_view_insert
    AFTER INSERT ON public.profile_views
    FOR EACH ROW EXECUTE FUNCTION public.broadcast_home_stats_on_view();

CREATE TRIGGER trg_broadcast_home_stats_message_insert
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.broadcast_home_stats_on_message();

-- ---- RLS: authorize receiving one's own home-stats channel --
-- Private Realtime channels are gated by RLS on `realtime.messages`. A user may
-- only receive broadcasts on their own `home-stats:<their uid>` topic. (The
-- triggers above insert via the SECURITY DEFINER `realtime.send`, which is not
-- governed by this SELECT policy.)

CREATE POLICY "Users receive their own home-stats broadcasts"
    ON realtime.messages
    FOR SELECT
    TO authenticated
    USING (
        realtime.messages.extension = 'broadcast'
        AND realtime.topic() = 'home-stats:' || (SELECT auth.uid())::text
    );
