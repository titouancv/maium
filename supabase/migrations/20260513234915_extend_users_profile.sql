alter table public.users
  drop column if exists name,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists pseudo text unique,
  add column if not exists dob date,
  add column if not exists professional_experiences jsonb not null default '[]'::jsonb,
  add column if not exists educational_experiences jsonb not null default '[]'::jsonb;
