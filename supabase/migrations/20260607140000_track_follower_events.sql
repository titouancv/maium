-- ============================================================
-- Follower events — append-only log of follow / unfollow actions
--
-- `user_follows` rows are deleted on unfollow, so its `created_at` only ever
-- tells us about *gains*. To compute a real net follower trend (gains minus
-- losses) over a time window, we mirror every follow (+1) and unfollow (-1)
-- into this log via triggers, then sum the deltas for the window.
-- ============================================================

CREATE TABLE public.follower_events (
    id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    actor_id    uuid        REFERENCES public.users(id) ON DELETE SET NULL,
    delta       smallint    NOT NULL CHECK (delta IN (-1, 1)),
    created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.follower_events IS
    'Append-only log of follow (+1) / unfollow (-1) events, used to compute net follower trends over time.';
COMMENT ON COLUMN public.follower_events.user_id IS 'The user who gained or lost a follower.';
COMMENT ON COLUMN public.follower_events.actor_id IS 'The user who followed or unfollowed.';

-- Trend queries always filter by user + time window.
CREATE INDEX idx_follower_events_user_created
    ON public.follower_events (user_id, created_at);

-- ---- RLS ----------------------------------------------------
-- Locked down: rows are written only by the SECURITY DEFINER trigger below and
-- read only via the SECURITY DEFINER RPC / service-role client. There is no
-- direct client access, so RLS is enabled with no policies (deny all).
ALTER TABLE public.follower_events ENABLE ROW LEVEL SECURITY;

-- ---- Trigger: mirror user_follows changes into the log ------

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
    ELSE
        INSERT INTO public.follower_events (user_id, actor_id, delta)
        VALUES (OLD.followed_id, OLD.follower_id, -1);
        RETURN OLD;
    END IF;
END;
$$;

CREATE TRIGGER trg_log_follower_event_insert
    AFTER INSERT ON public.user_follows
    FOR EACH ROW EXECUTE FUNCTION public.log_follower_event();

CREATE TRIGGER trg_log_follower_event_delete
    AFTER DELETE ON public.user_follows
    FOR EACH ROW EXECUTE FUNCTION public.log_follower_event();

-- ---- Backfill from existing follows ------------------------
-- Seed a +1 event (at the real follow time) for every current follow so the
-- history isn't empty. Past unfollows are unrecoverable, but every window from
-- here on is accurate.
INSERT INTO public.follower_events (user_id, actor_id, delta, created_at)
SELECT followed_id, follower_id, 1, created_at
FROM public.user_follows;

-- ---- RPC: net follower change over a window ----------------
-- Sums the deltas for one user since `p_since`. Called server-side with the
-- already-authenticated user's id (the admin client has no JWT, so we can't
-- rely on auth.uid() here). Follower counts are public, so this is not
-- sensitive data.

CREATE OR REPLACE FUNCTION public.get_follower_net_change(
    p_user_id uuid,
    p_since   timestamptz
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COALESCE(SUM(delta), 0)::integer
    FROM public.follower_events
    WHERE user_id = p_user_id
      AND created_at >= p_since;
$$;

GRANT EXECUTE ON FUNCTION public.get_follower_net_change(uuid, timestamptz)
    TO authenticated, service_role;
