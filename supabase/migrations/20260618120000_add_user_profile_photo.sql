-- Custom profile photos: users can upload a 5:7 portrait that replaces the
-- bundled default avatar everywhere it is shown. Stored as the public URL of the
-- uploaded object in the `profile-photos` Storage bucket (see the companion
-- migration); NULL means "use the deterministic default photo".
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_photo TEXT;
