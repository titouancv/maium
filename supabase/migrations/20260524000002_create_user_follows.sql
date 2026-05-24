-- ============================================================
-- User follows (follower / followed relationship)
-- ============================================================

CREATE TABLE public.user_follows (
    follower_id  uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    followed_id  uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at   timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (follower_id, followed_id),
    CONSTRAINT no_self_follow CHECK (follower_id <> followed_id)
);

-- ---- Indexes ------------------------------------------------

CREATE INDEX idx_user_follows_follower ON public.user_follows (follower_id);
CREATE INDEX idx_user_follows_followed ON public.user_follows (followed_id);

-- ---- RLS ----------------------------------------------------

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see follows (needed to display follower counts on profiles)
CREATE POLICY "Follows are publicly readable"
    ON public.user_follows FOR SELECT
    TO authenticated
    USING (true);

-- A user can only follow/unfollow as themselves
CREATE POLICY "Users manage their own follows"
    ON public.user_follows FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users manage their own unfollows"
    ON public.user_follows FOR DELETE
    TO authenticated
    USING (auth.uid() = follower_id);
