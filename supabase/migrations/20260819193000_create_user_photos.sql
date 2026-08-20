CREATE TABLE public.user_photos (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    url        text        NOT NULL,
    path       text        NOT NULL,
    position   int         NOT NULL DEFAULT 0 CHECK (position >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_photos_user_id ON public.user_photos (user_id, position);

ALTER TABLE public.user_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own photos"
    ON public.user_photos FOR ALL
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('profile-gallery-photos', 'profile-gallery-photos', true)
on conflict (id) do nothing;

create policy "Gallery photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'profile-gallery-photos');

create policy "Users can upload their own gallery photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-gallery-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own gallery photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-gallery-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'profile-gallery-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own gallery photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-gallery-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
