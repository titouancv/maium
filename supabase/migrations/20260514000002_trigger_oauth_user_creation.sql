create or replace function public.handle_new_oauth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- only handle OAuth signups (not email/password which goes through POST /api/users)
  if new.raw_app_meta_data->>'provider' = 'email' then
    return new;
  end if;

  insert into public.users (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'given_name',
    new.raw_user_meta_data->>'family_name'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_oauth_user();
