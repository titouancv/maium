-- Suggested users for the home dashboard: the most-followed profiles the
-- current user does not already follow (and that aren't themselves).
--
-- Counting followers per user requires an aggregate over user_follows, so it
-- lives in a single set-returning function instead of being assembled in app
-- code. `auth.uid()` resolves the caller from their JWT, so the current user is
-- never passed in (and can't be spoofed).

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
    and u.id <> auth.uid()
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

grant execute on function public.get_suggested_users(int) to authenticated;
