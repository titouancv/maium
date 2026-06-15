-- ============================================================
-- Fix: account deletion blocked by the follower_events mirror trigger
--
-- `log_follower_event` (20260607140000_track_follower_events) fires AFTER DELETE
-- on user_follows and logs a -1 event. That DELETE happens both on a real
-- unfollow AND as a cascade side effect when a user (follower or followed) is
-- deleted. In the cascade case the referenced user rows are already gone, so the
-- -1 insert violates follower_events' foreign keys
-- (actor_id / user_id -> public.users(id)) and aborts the whole
-- `DELETE FROM users` — i.e. account deletion silently fails (500).
--
-- There is no trend to record for a deleted account, so only log the -1 when
-- both parties still exist (a genuine unfollow). The +1 insert path is
-- unchanged.
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_follower_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.follower_events (user_id, actor_id, delta)
        VALUES (NEW.followed_id, NEW.follower_id, 1);
        RETURN NEW;
    END IF;

    -- DELETE: skip the -1 when the unfollow is a side effect of one of the two
    -- users being deleted (its row is already gone, so the insert would violate
    -- follower_events' FKs and abort the account deletion). Only a genuine
    -- unfollow — both users still present — is logged.
    IF EXISTS (SELECT 1 FROM public.users WHERE id = OLD.followed_id)
       AND EXISTS (SELECT 1 FROM public.users WHERE id = OLD.follower_id) THEN
        INSERT INTO public.follower_events (user_id, actor_id, delta)
        VALUES (OLD.followed_id, OLD.follower_id, -1);
    END IF;
    RETURN OLD;
END;
$$;
