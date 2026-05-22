alter table public.users
  add column if not exists social_networks jsonb not null default '[]',
  add column if not exists hobbies jsonb not null default '[]',
  add column if not exists personal_experiences jsonb not null default '[]',
  add column if not exists skills jsonb not null default '[]',
  add column if not exists projects jsonb not null default '[]';
