create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  name text not null,
  created_at timestamptz default now() not null
);

alter table public.users enable row level security;

create policy "Users can read their own row"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can insert their own row"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update their own row"
  on public.users for update
  using (auth.uid() = id);
