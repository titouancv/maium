-- ============================================================
-- Anonymous job analyses
--
-- The analysis is the product's most convincing feature and was locked behind
-- an account, so a visitor never saw it. It can now run once without signing
-- up: the visitor uploads a CV (parsed by /api/cv/parse), submits an offer, and
-- gets the full pipeline — analysis, optimized resume, cover letter.
--
-- Two changes to the pipeline tables:
--   * `user_id` becomes nullable, paired with an `anon_id` that identifies a
--     browser via an httpOnly cookie. Exactly one of the two is set.
--   * `analysis_jobs.cv_extraction` carries the parsed CV, standing in for the
--     `users` row the pipeline would otherwise read the profile from. It is
--     also what fills the account at signup, so the visitor never re-uploads.
--
-- Anonymous rows are **not** exposed to the `anon` Postgres role. They are
-- reached only through the service-role client, behind a cookie check in the
-- route handlers — possession of the cookie is the entire access right. The
-- existing `auth.uid() = user_id` policies never match a NULL `user_id`, which
-- is exactly the intent.
--
-- Anonymous rows expire; a signup claims them (clearing `anon_id` and
-- `expires_at`) and they become permanent.
-- ============================================================

-- ---- 1. analysis_jobs ---------------------------------------
ALTER TABLE public.analysis_jobs
    ALTER COLUMN user_id DROP NOT NULL,
    ADD COLUMN anon_id       uuid,
    ADD COLUMN cv_extraction jsonb,
    ADD COLUMN client_ip     inet,
    ADD COLUMN expires_at    timestamptz;

COMMENT ON COLUMN public.analysis_jobs.anon_id IS
    'Browser identity for a signed-out run; mutually exclusive with user_id.';
COMMENT ON COLUMN public.analysis_jobs.cv_extraction IS
    'Parsed CV for a signed-out run, standing in for the users row. Also used to fill the account on signup.';
COMMENT ON COLUMN public.analysis_jobs.client_ip IS
    'Origin of a signed-out run, for the per-IP abuse ceiling.';
COMMENT ON COLUMN public.analysis_jobs.expires_at IS
    'When a signed-out run is purged. NULL once claimed by an account.';

ALTER TABLE public.analysis_jobs ADD CONSTRAINT analysis_jobs_owner
    CHECK (num_nonnulls(user_id, anon_id) = 1);

-- ---- 2. analyses --------------------------------------------
ALTER TABLE public.analyses
    ALTER COLUMN user_id DROP NOT NULL,
    ADD COLUMN anon_id    uuid,
    ADD COLUMN expires_at timestamptz;

ALTER TABLE public.analyses ADD CONSTRAINT analyses_owner
    CHECK (num_nonnulls(user_id, anon_id) = 1);

-- ---- 3. optimized_resumes -----------------------------------
ALTER TABLE public.optimized_resumes
    ALTER COLUMN user_id DROP NOT NULL,
    ADD COLUMN anon_id    uuid,
    ADD COLUMN expires_at timestamptz;

ALTER TABLE public.optimized_resumes ADD CONSTRAINT optimized_resumes_owner
    CHECK (num_nonnulls(user_id, anon_id) = 1);

-- ---- 4. Indexes ---------------------------------------------
-- Lookups are always "this browser's rows, newest first".
CREATE INDEX idx_analysis_jobs_anon
    ON public.analysis_jobs (anon_id, created_at DESC) WHERE anon_id IS NOT NULL;
CREATE INDEX idx_analyses_anon
    ON public.analyses (anon_id, created_at DESC) WHERE anon_id IS NOT NULL;
CREATE INDEX idx_optimized_resumes_anon
    ON public.optimized_resumes (anon_id) WHERE anon_id IS NOT NULL;

-- Backs the per-IP ceiling for signed-out runs.
CREATE INDEX idx_analysis_jobs_client_ip
    ON public.analysis_jobs (client_ip, created_at DESC) WHERE client_ip IS NOT NULL;

-- Supports the retention sweep below.
CREATE INDEX idx_analysis_jobs_expires
    ON public.analysis_jobs (expires_at) WHERE expires_at IS NOT NULL;

-- ---- 5. Retention -------------------------------------------
-- Unclaimed anonymous runs are deleted once expired. `analyses` and
-- `optimized_resumes` reference `jobs`, not `analysis_jobs`, so each table is
-- swept on its own rather than by cascade.
CREATE OR REPLACE FUNCTION public.purge_expired_anonymous_analyses()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    DELETE FROM public.optimized_resumes WHERE expires_at IS NOT NULL AND expires_at < now();
    DELETE FROM public.analyses          WHERE expires_at IS NOT NULL AND expires_at < now();
    DELETE FROM public.analysis_jobs     WHERE expires_at IS NOT NULL AND expires_at < now();
$$;

COMMENT ON FUNCTION public.purge_expired_anonymous_analyses() IS
    'Deletes unclaimed signed-out analyses past their expiry. Schedule with pg_cron.';
