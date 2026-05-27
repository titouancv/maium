-- Workflow tables v2: async pipeline for resume analysis
-- Tables: jobs, user_jobs, job_analyses, optimized_resumes, resume_versions, llm_requests, workflow_events

-- ─── jobs ────────────────────────────────────────────────────────────────────
-- Deduplicated job offers. One row per unique normalized URL.

CREATE TABLE IF NOT EXISTS public.jobs (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    source_url           TEXT        NOT NULL,
    normalized_url_hash  TEXT        NOT NULL UNIQUE,
    title                TEXT        NOT NULL DEFAULT '',
    company              TEXT        NOT NULL DEFAULT '',
    location             TEXT,
    employment_type      TEXT,
    salary               TEXT,
    seniority            TEXT,
    description          TEXT        NOT NULL DEFAULT '',
    raw_content          TEXT,
    extracted_json       JSONB       NOT NULL DEFAULT '{}',
    skills               JSONB       NOT NULL DEFAULT '[]',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_url_hash ON public.jobs (normalized_url_hash);

-- ─── user_jobs ───────────────────────────────────────────────────────────────
-- One row per user×analysis request. Tracks the async workflow state.

CREATE TABLE IF NOT EXISTS public.user_jobs (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_id      TEXT        NOT NULL UNIQUE,
    user_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_id           UUID        REFERENCES public.jobs(id),
    -- Filled progressively as the pipeline advances:
    analysis_id      UUID,
    resume_id        UUID,
    status           TEXT        NOT NULL DEFAULT 'queued',  -- queued|processing|completed|failed|cancelled
    current_step     TEXT,                                   -- JOB_EXTRACTION|PROFILE_MATCHING|RESUME_OPTIMIZATION
    progress         INT         NOT NULL DEFAULT 0,
    failure_reason   TEXT,
    retry_count      INT         NOT NULL DEFAULT 0,
    idempotency_key  TEXT,
    is_deleted       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_jobs_user_id      ON public.user_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_user_jobs_tracking_id  ON public.user_jobs (tracking_id);
CREATE INDEX IF NOT EXISTS idx_user_jobs_idempotency  ON public.user_jobs (idempotency_key)
    WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_jobs_status       ON public.user_jobs (user_id, status);

-- ─── job_analyses ─────────────────────────────────────────────────────────────
-- Match analysis (LLM + heuristic) for a given user×job pair.

CREATE TABLE IF NOT EXISTS public.job_analyses (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_id           UUID        NOT NULL REFERENCES public.jobs(id),
    user_job_id      UUID        NOT NULL REFERENCES public.user_jobs(id) ON DELETE CASCADE,
    matching_score   INT         NOT NULL DEFAULT 0,
    confidence_score FLOAT       NOT NULL DEFAULT 0,
    analysis_json    JSONB       NOT NULL DEFAULT '{}',
    model_name       TEXT,
    prompt_version   TEXT,
    token_usage      JSONB       DEFAULT '{"input": 0, "output": 0}',
    latency_ms       INT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_analyses_user_id     ON public.job_analyses (user_id);
CREATE INDEX IF NOT EXISTS idx_job_analyses_user_job_id ON public.job_analyses (user_job_id);

-- ─── optimized_resumes ────────────────────────────────────────────────────────
-- Versioned CV result for a user×job×analysis triple.

CREATE TABLE IF NOT EXISTS public.optimized_resumes (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_id                UUID        NOT NULL REFERENCES public.jobs(id),
    analysis_id           UUID        REFERENCES public.job_analyses(id),
    user_job_id           UUID        NOT NULL REFERENCES public.user_jobs(id) ON DELETE CASCADE,
    optimized_resume_json JSONB       NOT NULL DEFAULT '{}',
    version               INT         NOT NULL DEFAULT 1,
    is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
    is_deleted            BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_optimized_resumes_user_id     ON public.optimized_resumes (user_id);
CREATE INDEX IF NOT EXISTS idx_optimized_resumes_user_job_id ON public.optimized_resumes (user_job_id);

-- ─── resume_versions ──────────────────────────────────────────────────────────
-- Full audit history when a CV is re-optimized.

CREATE TABLE IF NOT EXISTS public.resume_versions (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id      UUID        NOT NULL REFERENCES public.optimized_resumes(id) ON DELETE CASCADE,
    version_number INT         NOT NULL,
    resume_json    JSONB       NOT NULL DEFAULT '{}',
    diff_summary   TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_versions_resume_id ON public.resume_versions (resume_id);

-- ─── llm_requests ─────────────────────────────────────────────────────────────
-- Audit trail for every LLM call: cost, latency, status.

CREATE TABLE IF NOT EXISTS public.llm_requests (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        REFERENCES public.users(id),
    user_job_id   UUID        REFERENCES public.user_jobs(id),
    provider      TEXT        NOT NULL DEFAULT 'mistral',
    model         TEXT        NOT NULL,
    operation     TEXT        NOT NULL,  -- job_extraction|match_analysis|resume_optimization
    prompt_hash   TEXT,
    input_tokens  INT         NOT NULL DEFAULT 0,
    output_tokens INT         NOT NULL DEFAULT 0,
    latency_ms    INT,
    status        TEXT        NOT NULL DEFAULT 'success',  -- success|failed|timeout
    error_message TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_requests_user_id     ON public.llm_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_llm_requests_user_job_id ON public.llm_requests (user_job_id);
CREATE INDEX IF NOT EXISTS idx_llm_requests_created_at  ON public.llm_requests (created_at);

-- ─── workflow_events ──────────────────────────────────────────────────────────
-- Immutable event log for observability and debugging.

CREATE TABLE IF NOT EXISTS public.workflow_events (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_job_id UUID        NOT NULL REFERENCES public.user_jobs(id) ON DELETE CASCADE,
    event_type  TEXT        NOT NULL,  -- JOB_EXTRACTION_COMPLETED|PROFILE_MATCH_COMPLETED|etc.
    payload     JSONB       DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_events_user_job_id ON public.workflow_events (user_job_id);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_jobs_updated_at ON public.user_jobs;
CREATE TRIGGER update_user_jobs_updated_at
    BEFORE UPDATE ON public.user_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Row-Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.jobs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_jobs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_analyses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimized_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_events  ENABLE ROW LEVEL SECURITY;

-- jobs: backend only
CREATE POLICY "jobs_service_role" ON public.jobs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- user_jobs: users read own; backend writes
CREATE POLICY "user_jobs_read_own" ON public.user_jobs
    FOR SELECT TO authenticated USING (auth.uid() = user_id AND is_deleted = false);
CREATE POLICY "user_jobs_service_role" ON public.user_jobs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- job_analyses: users read own; backend writes
CREATE POLICY "job_analyses_read_own" ON public.job_analyses
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "job_analyses_service_role" ON public.job_analyses
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- optimized_resumes: users read non-deleted own; backend writes
CREATE POLICY "optimized_resumes_read_own" ON public.optimized_resumes
    FOR SELECT TO authenticated USING (auth.uid() = user_id AND is_deleted = false);
CREATE POLICY "optimized_resumes_service_role" ON public.optimized_resumes
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- resume_versions: backend only
CREATE POLICY "resume_versions_service_role" ON public.resume_versions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- llm_requests: backend only
CREATE POLICY "llm_requests_service_role" ON public.llm_requests
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- workflow_events: backend only
CREATE POLICY "workflow_events_service_role" ON public.workflow_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);
