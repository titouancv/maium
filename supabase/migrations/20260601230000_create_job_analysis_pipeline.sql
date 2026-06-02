-- ============================================================
-- Job-analysis pipeline (Next.js + Supabase + Mistral)
-- Re-implements the former external microservices pipeline inline:
-- shared job postings, per-user analysis jobs, hybrid-match results,
-- optimized resumes with versioning, LLM audit logs and usage quotas.
-- ============================================================

-- ---- 0. pgvector --------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

-- ---- 1. jobs (shared / mutualised across users) -------------
-- No user_id: a job posting is global, deduplicated by normalized_url_hash.
-- Written only by the server (service-role / admin client, which bypasses RLS),
-- so there is no INSERT/UPDATE policy — only authenticated SELECT.
CREATE TABLE public.jobs (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    source_url          text        NOT NULL,
    normalized_url_hash text        NOT NULL UNIQUE,
    title               text,
    company             text,
    location            text,
    employment_type     text,
    salary              text,
    description         text,
    requirements        jsonb       NOT NULL DEFAULT '[]',
    skills              jsonb       NOT NULL DEFAULT '[]',
    seniority           text,
    embedding           vector(1024),
    extracted_at        timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now()
);

-- ---- 2. analysis_jobs (workflow state, per user) ------------
CREATE TABLE public.analysis_jobs (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_id        uuid        REFERENCES public.jobs(id) ON DELETE SET NULL,
    source_url    text        NOT NULL,
    status        text        NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    current_step  text        CHECK (current_step IN (
                      'EXTRACTING_JOB', 'MATCHING_PROFILE',
                      'OPTIMIZING_RESUME', 'GENERATING_EMBEDDINGS')),
    progress      int         NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    analysis_id   uuid,
    error_message text,
    started_at    timestamptz,
    completed_at  timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---- 3. analyses (hybrid-match result) ----------------------
CREATE TABLE public.analyses (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_id           uuid        NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    matching_score   numeric     NOT NULL DEFAULT 0,
    confidence_score numeric     NOT NULL DEFAULT 0,
    strengths        jsonb       NOT NULL DEFAULT '[]',
    weaknesses       jsonb       NOT NULL DEFAULT '[]',
    missing_skills   jsonb       NOT NULL DEFAULT '[]',
    recommendations  jsonb       NOT NULL DEFAULT '[]',
    summary          text,
    model            text,
    prompt_version   text,
    created_at       timestamptz NOT NULL DEFAULT now()
);

-- ---- 4. optimized_resumes (generated CVs) -------------------
CREATE TABLE public.optimized_resumes (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_id      uuid        NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    analysis_id uuid        REFERENCES public.analyses(id) ON DELETE SET NULL,
    version     int         NOT NULL DEFAULT 1,
    resume_json jsonb       NOT NULL DEFAULT '{}',
    ats_score   numeric,
    is_active   boolean     NOT NULL DEFAULT true,
    deleted_at  timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---- 5. resume_versions (full history) ----------------------
CREATE TABLE public.resume_versions (
    id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id      uuid        NOT NULL REFERENCES public.optimized_resumes(id) ON DELETE CASCADE,
    version_number int         NOT NULL,
    resume_json    jsonb       NOT NULL DEFAULT '{}',
    diff_summary   text,
    created_at     timestamptz NOT NULL DEFAULT now()
);

-- ---- 6. llm_logs (AI audit) ---------------------------------
CREATE TABLE public.llm_logs (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid        REFERENCES public.users(id) ON DELETE SET NULL,
    operation     text        NOT NULL,
    model         text,
    input_tokens  int         NOT NULL DEFAULT 0,
    output_tokens int         NOT NULL DEFAULT 0,
    latency_ms    int         NOT NULL DEFAULT 0,
    cost_estimate numeric     NOT NULL DEFAULT 0,
    status        text        NOT NULL DEFAULT 'success',
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---- 7. user_usage (quota / rate-limit) ---------------------
CREATE TABLE public.user_usage (
    user_id              uuid        PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    analyses_this_month  int         NOT NULL DEFAULT 0,
    tokens_used          bigint      NOT NULL DEFAULT 0,
    period_start         date        NOT NULL DEFAULT date_trunc('month', now())::date,
    updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ---- 8. Indexes ---------------------------------------------
CREATE INDEX idx_analysis_jobs_user      ON public.analysis_jobs (user_id, created_at DESC);
CREATE INDEX idx_analyses_user           ON public.analyses (user_id, created_at DESC);
CREATE INDEX idx_optimized_resumes_user  ON public.optimized_resumes (user_id, job_id, is_active);
CREATE INDEX idx_resume_versions_resume  ON public.resume_versions (resume_id, version_number DESC);
CREATE INDEX idx_llm_logs_user           ON public.llm_logs (user_id, created_at DESC);
-- Approximate-nearest-neighbour index for future "similar jobs" search.
CREATE INDEX idx_jobs_embedding ON public.jobs
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ---- 9. RLS -------------------------------------------------
ALTER TABLE public.jobs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_jobs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimized_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage        ENABLE ROW LEVEL SECURITY;

-- jobs: any authenticated user can read; writes happen via service-role only.
CREATE POLICY "authenticated users can read jobs"
    ON public.jobs FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- analysis_jobs: owner-only.
CREATE POLICY "users manage their own analysis jobs"
    ON public.analysis_jobs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- analyses: owner-only.
CREATE POLICY "users read their own analyses"
    ON public.analyses FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- optimized_resumes: owner-only.
CREATE POLICY "users manage their own resumes"
    ON public.optimized_resumes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- resume_versions: scoped through the parent resume's owner.
CREATE POLICY "users read their own resume versions"
    ON public.resume_versions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.optimized_resumes r
        WHERE r.id = resume_versions.resume_id
          AND r.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.optimized_resumes r
        WHERE r.id = resume_versions.resume_id
          AND r.user_id = auth.uid()
    ));

-- llm_logs: owner can read; inserts happen via service-role only.
CREATE POLICY "users read their own llm logs"
    ON public.llm_logs FOR SELECT
    USING (auth.uid() = user_id);

-- user_usage: owner can read; writes happen via service-role only.
CREATE POLICY "users read their own usage"
    ON public.user_usage FOR SELECT
    USING (auth.uid() = user_id);

-- ---- 10. Realtime -------------------------------------------
-- The UI subscribes to analysis_jobs to follow pipeline progress live.
ALTER PUBLICATION supabase_realtime ADD TABLE public.analysis_jobs;
