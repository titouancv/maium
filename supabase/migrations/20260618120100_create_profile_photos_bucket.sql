-- Storage bucket backing custom profile photos.
--
-- Public read (avatars are shown to everyone, signed in or not); writes are
-- scoped per-user: each user may only create/update/delete objects under a
-- folder named after their own auth id (`<auth.uid()>/…`). The folder convention
-- is enforced by the policies below via storage.foldername(name)[1].

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

-- Anyone can read profile photos (public bucket).
create policy "Profile photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

-- A user can upload only into their own `<uid>/` folder.
create policy "Users can upload their own profile photo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- A user can replace only their own objects.
create policy "Users can update their own profile photo"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- A user can delete only their own objects.
create policy "Users can delete their own profile photo"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
