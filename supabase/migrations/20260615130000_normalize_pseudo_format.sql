-- ============================================================
-- Enforce the pseudo (username) format: lowercase letters and dots only.
--
-- Product rule: a pseudo may only contain lowercase letters [a-z] and dots.
-- No uppercase, no whitespace, no digits, no other punctuation. This mirrors
-- the client-side normalization (sanitizePseudo) and the Zod validator
-- (PSEUDO_REGEX) so the database is the final source of truth.
--
-- Step 1 rewrites every existing pseudo into the new format.
-- Step 2 adds a CHECK constraint so future writes can't violate it.
-- ============================================================

-- Step 1 — normalize existing pseudos.
DO $$
DECLARE
    rec       RECORD;
    base      text;
    candidate text;
    suffix    int;
BEGIN
    FOR rec IN
        SELECT id, pseudo
        FROM public.users
        WHERE pseudo IS NOT NULL
        ORDER BY created_at, id
    LOOP
        -- lowercase, drop every character that isn't a letter or a dot,
        -- collapse repeated dots and trim leading/trailing dots.
        base := regexp_replace(lower(rec.pseudo), '[^a-z.]', '', 'g');
        base := regexp_replace(base, '\.{2,}', '.', 'g');
        base := trim(both '.' from base);

        -- fallback when nothing usable survives (e.g. a digits-only pseudo).
        IF base IS NULL OR base = '' THEN
            base := 'user';
        END IF;

        -- ensure uniqueness without introducing forbidden characters:
        -- append '.' + a letter run (.a, .aa, .aaa, …) until free.
        candidate := base;
        suffix := 0;
        WHILE EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.pseudo = candidate AND u.id <> rec.id
        ) LOOP
            suffix := suffix + 1;
            candidate := base || '.' || repeat('a', suffix);
        END LOOP;

        IF candidate <> rec.pseudo THEN
            UPDATE public.users SET pseudo = candidate WHERE id = rec.id;
        END IF;
    END LOOP;
END $$;

-- Step 2 — lock the format in. NULL stays allowed (pseudo is set after signup).
ALTER TABLE public.users
    DROP CONSTRAINT IF EXISTS users_pseudo_format_check;

ALTER TABLE public.users
    ADD CONSTRAINT users_pseudo_format_check
    CHECK (pseudo IS NULL OR pseudo ~ '^[a-z.]+$');
