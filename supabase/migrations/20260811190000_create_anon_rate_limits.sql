-- ============================================================
-- Per-IP rate limiting for unauthenticated, paid endpoints
--
-- `POST /api/cv/parse` runs an OCR call plus an LLM call and, by design, works
-- without an account (it serves both the signup wizard and the anonymous
-- analysis funnel). The authenticated pipeline throttles per user via
-- `analysis_jobs` + `user_usage`, but an anonymous caller has no user id to
-- count against — hence a generic append-only log keyed on the client IP.
--
-- One row per accepted request. Callers count rows in a rolling window before
-- doing the expensive work (see lib/rateLimit.ts).
--
-- Modelled on public.follower_events / public.profile_views: RLS enabled with
-- NO policies (deny-all). Written and read only through the service-role
-- client, never from the browser.
-- ============================================================

CREATE TABLE public.anon_rate_limits (
    id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    operation  text        NOT NULL,
    client_ip  inet        NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.anon_rate_limits IS
    'Append-only log of rate-limited anonymous requests, one row per accepted call.';
COMMENT ON COLUMN public.anon_rate_limits.operation IS
    'Logical bucket being limited (e.g. cv_parse) — limits are per operation.';

-- The only query shape: count rows for (operation, ip) since a cutoff.
CREATE INDEX idx_anon_rate_limits_lookup
    ON public.anon_rate_limits (operation, client_ip, created_at DESC);

-- Supports the retention sweep below.
CREATE INDEX idx_anon_rate_limits_created
    ON public.anon_rate_limits (created_at);

ALTER TABLE public.anon_rate_limits ENABLE ROW LEVEL SECURITY;

-- ---- Retention ----------------------------------------------
-- Rows are only meaningful inside the limiter's window; keeping IPs longer
-- than needed would be a liability. Sweep anything older than a day.
CREATE OR REPLACE FUNCTION public.purge_anon_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    DELETE FROM public.anon_rate_limits WHERE created_at < now() - interval '1 day';
$$;

COMMENT ON FUNCTION public.purge_anon_rate_limits() IS
    'Deletes rate-limit rows older than a day. Schedule with pg_cron.';
