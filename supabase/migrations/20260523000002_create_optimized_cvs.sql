-- Stores AI-generated optimized CVs.
-- Each row = one optimization for a given user × job offer.

create table if not exists public.optimized_cvs (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references public.users(id) on delete cascade,
    job_url      text not null,
    company      text,
    job_title    text,
    ats_score    int check (ats_score >= 0 and ats_score <= 100),
    generated_cv jsonb not null,    -- serialised OptimizedCV
    created_at   timestamptz default now() not null
);

-- Quickly retrieve all CVs for a given user, most recent first
create index if not exists idx_optimized_cvs_user_id on public.optimized_cvs (user_id, created_at desc);

-- RLS: users can only see and delete their own optimized CVs
alter table public.optimized_cvs enable row level security;

create policy "Users can read their own optimized CVs"
    on public.optimized_cvs for select
    using (auth.uid() = user_id);

create policy "Users can delete their own optimized CVs"
    on public.optimized_cvs for delete
    using (auth.uid() = user_id);

-- Inserts are performed by the backend (service role) only —
-- no INSERT policy for regular users.
