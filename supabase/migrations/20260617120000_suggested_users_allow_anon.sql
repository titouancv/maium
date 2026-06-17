-- Make `get_suggested_users` work for signed-out visitors so the home page can
-- showcase the most-followed profiles to anonymous users.
--
-- Two changes vs the original:
--   1. `auth.uid()` is NULL when signed out. `u.id <> auth.uid()` would then
--      evaluate to NULL (excluding every row), so the function returned nothing.
--      `is distinct from` is NULL-safe: with a NULL caller it keeps every row
--      (and the "already followed" subquery already no-ops on a NULL follower).
--   2. Grant execute to `anon` so the unauthenticated server client can call it.
--
-- For a signed-out caller this degenerates to "the most-followed onboarded
-- profiles" — exactly the popular-accounts list we want to show.

create or replace function public.get_suggested_users(p_limit int default 12)
returns table (
  pseudo          text,
  first_name      text,
  last_name       text,
  location        text,
  followers_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    u.pseudo,
    u.first_name,
    u.last_name,
    u.location,
    count(f.follower_id) as followers_count
  from public.users u
  left join public.user_follows f on f.followed_id = u.id
  where u.onboarding_completed = true
    and u.id is distinct from auth.uid()
    and not exists (
      select 1
      from public.user_follows uf
      where uf.follower_id = auth.uid()
        and uf.followed_id = u.id
    )
  group by u.id
  order by followers_count desc, u.created_at desc
  limit p_limit;
$$;

grant execute on function public.get_suggested_users(int) to anon;
