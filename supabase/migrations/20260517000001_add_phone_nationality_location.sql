alter table public.users
  add column if not exists phone text,
  add column if not exists nationality text,
  add column if not exists location text;
