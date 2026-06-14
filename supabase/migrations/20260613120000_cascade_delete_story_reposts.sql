-- ============================================================
-- Cascade repost deletion when the original story is deleted
--
-- A repost references the story it copies via `original_story_id`. That FK was
-- created with `ON DELETE SET NULL`, so deleting the original story only nulled
-- the reference and left every repost in place on the feeds that reposted it.
--
-- The intended behaviour is that deleting a story also removes it from every
-- account that reposted it. Switching the FK to `ON DELETE CASCADE` does exactly
-- that: when an author deletes their story, Postgres deletes all reposts that
-- point to it. The cascade runs at the system level (it bypasses RLS), so the
-- author's delete reaches reposts authored by other users too. Repost chains
-- (a repost of a repost) are pruned transitively by the same cascade.
-- ============================================================

ALTER TABLE public.stories
    DROP CONSTRAINT stories_original_story_id_fkey;

ALTER TABLE public.stories
    ADD CONSTRAINT stories_original_story_id_fkey
        FOREIGN KEY (original_story_id)
        REFERENCES public.stories(id)
        ON DELETE CASCADE;
