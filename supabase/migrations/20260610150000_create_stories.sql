-- ============================================================
-- Stories — ephemeral markdown posts shown on the home feed
--
-- A story is a short markdown post by a user. It is visible to the author and
-- to everyone who follows the author, and disappears from the feed 24h after
-- creation (filtered in queries via `expires_at`, not RLS, so an author can
-- still read back their own expired stories later if needed).
--
-- A story can be a *repost* of another visible story: it keeps a reference to
-- the original story and its author, and copies the content so it renders
-- standalone. `is_repost` / `original_*` are also the extension point for
-- future repost-related features.
-- ============================================================

CREATE TABLE public.stories (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id           uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content             text        NOT NULL,
    is_repost           boolean     NOT NULL DEFAULT false,
    original_author_id  uuid        REFERENCES public.users(id) ON DELETE SET NULL,
    original_story_id   uuid        REFERENCES public.stories(id) ON DELETE SET NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    expires_at          timestamptz NOT NULL DEFAULT now() + interval '24 hours'
);

COMMENT ON TABLE public.stories IS
    'Ephemeral markdown stories shown on the home feed (24h lifetime via expires_at).';
COMMENT ON COLUMN public.stories.is_repost IS 'True when this story reposts another story.';
COMMENT ON COLUMN public.stories.original_author_id IS 'Author of the reposted (original) story.';
COMMENT ON COLUMN public.stories.original_story_id IS 'The reposted (original) story.';

-- Feed queries fetch a user's stories in chronological order; the expiry filter
-- prunes old rows.
CREATE INDEX idx_stories_author_created ON public.stories (author_id, created_at);
CREATE INDEX idx_stories_expires_at ON public.stories (expires_at);

-- ---- RLS ----------------------------------------------------

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Authors see their own stories; followers see the stories of people they follow.
CREATE POLICY "Stories are visible to author and followers"
    ON public.stories FOR SELECT
    TO authenticated
    USING (
        author_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.user_follows
            WHERE follower_id = (SELECT auth.uid())
              AND followed_id = author_id
        )
    );

CREATE POLICY "Users create their own stories"
    ON public.stories FOR INSERT
    TO authenticated
    WITH CHECK (author_id = (SELECT auth.uid()));

CREATE POLICY "Users delete their own stories"
    ON public.stories FOR DELETE
    TO authenticated
    USING (author_id = (SELECT auth.uid()));

-- ============================================================
-- Story views — per-viewer "seen" tracking (drives the unseen ring)
-- ============================================================

CREATE TABLE public.story_views (
    story_id    uuid        NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    viewer_id   uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (story_id, viewer_id)
);

COMMENT ON TABLE public.story_views IS
    'Append-only record that a viewer has seen a story (one row per viewer/story).';

CREATE INDEX idx_story_views_viewer ON public.story_views (viewer_id);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- A viewer only ever reads/writes their own view rows.
CREATE POLICY "Users read their own story views"
    ON public.story_views FOR SELECT
    TO authenticated
    USING (viewer_id = (SELECT auth.uid()));

CREATE POLICY "Users record their own story views"
    ON public.story_views FOR INSERT
    TO authenticated
    WITH CHECK (viewer_id = (SELECT auth.uid()));

-- ============================================================
-- Story likes — persisted "J'aime" toggle
-- ============================================================

CREATE TABLE public.story_likes (
    story_id    uuid        NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    liker_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),

    PRIMARY KEY (story_id, liker_id)
);

COMMENT ON TABLE public.story_likes IS
    'One row per user who liked a story.';

CREATE INDEX idx_story_likes_liker ON public.story_likes (liker_id);

ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

-- A user manages only their own likes.
CREATE POLICY "Users read their own story likes"
    ON public.story_likes FOR SELECT
    TO authenticated
    USING (liker_id = (SELECT auth.uid()));

CREATE POLICY "Users create their own story likes"
    ON public.story_likes FOR INSERT
    TO authenticated
    WITH CHECK (liker_id = (SELECT auth.uid()));

CREATE POLICY "Users delete their own story likes"
    ON public.story_likes FOR DELETE
    TO authenticated
    USING (liker_id = (SELECT auth.uid()));
