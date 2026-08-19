ALTER TABLE public.user_hobbies
  ADD COLUMN category text NOT NULL DEFAULT 'text'
    CHECK (category IN ('club', 'personality', 'place', 'text')),
  ADD COLUMN image_url text,
  ADD COLUMN source_url text;
