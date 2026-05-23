-- Cache for scraped job offers.
-- Avoids re-scraping the same URL and reduces costs / blocking risks.

create table if not exists public.cached_jobs (
    url_hash     text primary key,                   -- SHA-256 of the original URL
    original_url text not null,
    parsed_json  jsonb not null,                     -- serialised JobOffer
    created_at   timestamptz default now() not null,
    expires_at   timestamptz not null
);

-- Speed up lookups by hash + expiration
create index if not exists idx_cached_jobs_expires_at on public.cached_jobs (expires_at);

-- RLS enabled: this table is accessed exclusively by the backend via the service role key.
-- End users never touch it directly.
alter table public.cached_jobs enable row level security;

-- No public policies: only the service role can read/write.
