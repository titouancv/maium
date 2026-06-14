-- ============================================================
-- Story like / repost counts — denormalized counters on `stories`
--
-- Displaying a story's like / repost totals previously meant fetching every
-- `story_likes` row and every repost story row for the whole feed and counting
-- them in app code (through the service-role client, since RLS scopes those
-- reads to the viewer's own rows). That transfers one row per like / repost just
-- to render a number.
--
-- Instead we keep two counters on the story itself, maintained by triggers — the
-- same trigger-backed-aggregate pattern as `follower_events`. The totals then
-- come back on the story row read by the normal RLS client, with no extra query.
--
--   * like_count   — rows in story_likes referencing the story.
--   * repost_count — story rows that repost it (is_repost, original_story_id = id).
-- ============================================================

-- IF NOT EXISTS so the migration stays re-runnable if an earlier attempt added
-- the columns before failing further down.
ALTER TABLE public.stories
    ADD COLUMN IF NOT EXISTS like_count   integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS repost_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.stories.like_count IS
    'Total likes on this story (maintained by the trigger on story_likes).';
COMMENT ON COLUMN public.stories.repost_count IS
    'Total reposts of this story (maintained by the trigger on stories.is_repost).';

-- ---- Backfill existing rows --------------------------------
UPDATE public.stories s
SET like_count = (
    SELECT count(*) FROM public.story_likes l WHERE l.story_id = s.id
);

UPDATE public.stories s
SET repost_count = (
    SELECT count(*) FROM public.stories r
    WHERE r.is_repost AND r.original_story_id = s.id
);

-- ---- Trigger: keep like_count in sync ----------------------
-- SECURITY DEFINER so a liker can bump the counter on a story they don't own:
-- there is no UPDATE policy on `stories`, and the counter is the only field ever
-- mutated here. A duplicate like (PK conflict, ignored on upsert) never inserts
-- a row, so the trigger can't double-count.
CREATE OR REPLACE FUNCTION public.sync_story_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.stories
        SET like_count = like_count + 1
        WHERE id = NEW.story_id;
        RETURN NEW;
    ELSE
        UPDATE public.stories
        SET like_count = like_count - 1
        WHERE id = OLD.story_id;
        RETURN OLD;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_story_like_count_insert ON public.story_likes;
CREATE TRIGGER trg_sync_story_like_count_insert
    AFTER INSERT ON public.story_likes
    FOR EACH ROW EXECUTE FUNCTION public.sync_story_like_count();

DROP TRIGGER IF EXISTS trg_sync_story_like_count_delete ON public.story_likes;
CREATE TRIGGER trg_sync_story_like_count_delete
    AFTER DELETE ON public.story_likes
    FOR EACH ROW EXECUTE FUNCTION public.sync_story_like_count();

-- ---- Trigger: keep repost_count in sync --------------------
-- Fires on every story insert/delete but only acts on reposts. When an original
-- story is deleted, the ON DELETE CASCADE removes its reposts and fires this
-- trigger for each one; that decrement targets the (also being deleted) original
-- story, so it is a harmless no-op. Non-repost rows short-circuit.
CREATE OR REPLACE FUNCTION public.sync_story_repost_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.is_repost AND NEW.original_story_id IS NOT NULL THEN
            UPDATE public.stories
            SET repost_count = repost_count + 1
            WHERE id = NEW.original_story_id;
        END IF;
        RETURN NEW;
    ELSE
        IF OLD.is_repost AND OLD.original_story_id IS NOT NULL THEN
            UPDATE public.stories
            SET repost_count = repost_count - 1
            WHERE id = OLD.original_story_id;
        END IF;
        RETURN OLD;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_story_repost_count_insert ON public.stories;
CREATE TRIGGER trg_sync_story_repost_count_insert
    AFTER INSERT ON public.stories
    FOR EACH ROW EXECUTE FUNCTION public.sync_story_repost_count();

DROP TRIGGER IF EXISTS trg_sync_story_repost_count_delete ON public.stories;
CREATE TRIGGER trg_sync_story_repost_count_delete
    AFTER DELETE ON public.stories
    FOR EACH ROW EXECUTE FUNCTION public.sync_story_repost_count();
