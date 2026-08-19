ALTER TABLE public.user_projects RENAME COLUMN url TO website_url;
ALTER TABLE public.user_projects ALTER COLUMN website_url DROP NOT NULL;
ALTER TABLE public.user_projects
  ADD COLUMN title text NOT NULL DEFAULT '',
  ADD COLUMN bio text,
  ADD COLUMN github_url text,
  ADD COLUMN image_url text,
  ADD COLUMN image_path text;

insert into storage.buckets (id, name, public)
values ('profile-project-images', 'profile-project-images', true)
on conflict (id) do nothing;

create policy "Project images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'profile-project-images');

create policy "Users can upload their own project images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-project-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own project images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-project-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'profile-project-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own project images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-project-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
