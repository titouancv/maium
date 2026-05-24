-- ============================================================
-- Normalise user profile data (Option A)
-- Replaces JSONB arrays in `users` with dedicated relational tables.
-- ============================================================

-- ---- 1. Enum for experience type ---------------------------

CREATE TYPE public.experience_type AS ENUM ('professional', 'educational', 'personal');

-- ---- 2. New tables -----------------------------------------

CREATE TABLE public.user_experiences (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type         public.experience_type NOT NULL,
    organization text        NOT NULL,
    role         text        NOT NULL,
    start_period bigint      NOT NULL,
    end_period   bigint,
    description  text,
    website      text,
    location     text,
    position     int         NOT NULL DEFAULT 0 CHECK (position >= 0),
    created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_skills (
    id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name     text NOT NULL,
    position int  NOT NULL DEFAULT 0 CHECK (position >= 0)
);

CREATE TABLE public.user_projects (
    id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    url      text NOT NULL,
    position int  NOT NULL DEFAULT 0 CHECK (position >= 0)
);

CREATE TABLE public.user_social_networks (
    id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    url      text NOT NULL,
    position int  NOT NULL DEFAULT 0 CHECK (position >= 0)
);

CREATE TABLE public.user_hobbies (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title       text NOT NULL,
    description text NOT NULL DEFAULT '',
    position    int  NOT NULL DEFAULT 0 CHECK (position >= 0)
);

-- ---- 3. Indexes --------------------------------------------

CREATE INDEX idx_user_experiences_user_id
    ON public.user_experiences (user_id, type, position);

CREATE INDEX idx_user_skills_user_id
    ON public.user_skills (user_id, position);

CREATE INDEX idx_user_projects_user_id
    ON public.user_projects (user_id, position);

CREATE INDEX idx_user_social_networks_user_id
    ON public.user_social_networks (user_id, position);

CREATE INDEX idx_user_hobbies_user_id
    ON public.user_hobbies (user_id, position);

-- ---- 4. RLS ------------------------------------------------

ALTER TABLE public.user_experiences     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_social_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hobbies         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own experiences"
    ON public.user_experiences FOR ALL
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own skills"
    ON public.user_skills FOR ALL
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own projects"
    ON public.user_projects FOR ALL
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own social networks"
    ON public.user_social_networks FOR ALL
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own hobbies"
    ON public.user_hobbies FOR ALL
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ---- 5. Data migration from JSONB -------------------------

-- professional_experiences
INSERT INTO public.user_experiences
    (user_id, type, organization, role, start_period, end_period, description, website, location, position)
SELECT
    u.id,
    'professional'::public.experience_type,
    COALESCE(NULLIF(exp.value->>'organization', ''), 'Unknown'),
    COALESCE(NULLIF(exp.value->>'role', ''),         'Unknown'),
    (exp.value->>'startPeriod')::bigint,
    (exp.value->>'endPeriod')::bigint,
    NULLIF(exp.value->>'description', ''),
    NULLIF(exp.value->>'website', ''),
    NULLIF(exp.value->>'location', ''),
    (exp.ordinality - 1)::int
FROM public.users u,
     jsonb_array_elements(u.professional_experiences) WITH ORDINALITY AS exp(value, ordinality)
WHERE jsonb_array_length(u.professional_experiences) > 0
  AND (exp.value->>'startPeriod') IS NOT NULL;

-- educational_experiences
INSERT INTO public.user_experiences
    (user_id, type, organization, role, start_period, end_period, description, website, location, position)
SELECT
    u.id,
    'educational'::public.experience_type,
    COALESCE(NULLIF(exp.value->>'organization', ''), 'Unknown'),
    COALESCE(NULLIF(exp.value->>'role', ''),         'Unknown'),
    (exp.value->>'startPeriod')::bigint,
    (exp.value->>'endPeriod')::bigint,
    NULLIF(exp.value->>'description', ''),
    NULLIF(exp.value->>'website', ''),
    NULLIF(exp.value->>'location', ''),
    (exp.ordinality - 1)::int
FROM public.users u,
     jsonb_array_elements(u.educational_experiences) WITH ORDINALITY AS exp(value, ordinality)
WHERE jsonb_array_length(u.educational_experiences) > 0
  AND (exp.value->>'startPeriod') IS NOT NULL;

-- personal_experiences
INSERT INTO public.user_experiences
    (user_id, type, organization, role, start_period, end_period, description, website, location, position)
SELECT
    u.id,
    'personal'::public.experience_type,
    COALESCE(NULLIF(exp.value->>'organization', ''), 'Unknown'),
    COALESCE(NULLIF(exp.value->>'role', ''),         'Unknown'),
    (exp.value->>'startPeriod')::bigint,
    (exp.value->>'endPeriod')::bigint,
    NULLIF(exp.value->>'description', ''),
    NULLIF(exp.value->>'website', ''),
    NULLIF(exp.value->>'location', ''),
    (exp.ordinality - 1)::int
FROM public.users u,
     jsonb_array_elements(u.personal_experiences) WITH ORDINALITY AS exp(value, ordinality)
WHERE jsonb_array_length(u.personal_experiences) > 0
  AND (exp.value->>'startPeriod') IS NOT NULL;

-- skills (array of plain strings)
INSERT INTO public.user_skills (user_id, name, position)
SELECT
    u.id,
    skill.value #>> '{}',
    (skill.ordinality - 1)::int
FROM public.users u,
     jsonb_array_elements(u.skills) WITH ORDINALITY AS skill(value, ordinality)
WHERE jsonb_array_length(u.skills) > 0
  AND NULLIF(skill.value #>> '{}', '') IS NOT NULL;

-- projects (array of URL strings)
INSERT INTO public.user_projects (user_id, url, position)
SELECT
    u.id,
    proj.value #>> '{}',
    (proj.ordinality - 1)::int
FROM public.users u,
     jsonb_array_elements(u.projects) WITH ORDINALITY AS proj(value, ordinality)
WHERE jsonb_array_length(u.projects) > 0
  AND NULLIF(proj.value #>> '{}', '') IS NOT NULL;

-- social_networks (array of URL strings)
INSERT INTO public.user_social_networks (user_id, url, position)
SELECT
    u.id,
    sn.value #>> '{}',
    (sn.ordinality - 1)::int
FROM public.users u,
     jsonb_array_elements(u.social_networks) WITH ORDINALITY AS sn(value, ordinality)
WHERE jsonb_array_length(u.social_networks) > 0
  AND NULLIF(sn.value #>> '{}', '') IS NOT NULL;

-- hobbies (array of {title, description} objects)
INSERT INTO public.user_hobbies (user_id, title, description, position)
SELECT
    u.id,
    COALESCE(NULLIF(h.value->>'title', ''), 'Untitled'),
    COALESCE(h.value->>'description', ''),
    (h.ordinality - 1)::int
FROM public.users u,
     jsonb_array_elements(u.hobbies) WITH ORDINALITY AS h(value, ordinality)
WHERE jsonb_array_length(u.hobbies) > 0;

-- ---- 6. Drop JSONB columns from users ----------------------

ALTER TABLE public.users
    DROP COLUMN IF EXISTS professional_experiences,
    DROP COLUMN IF EXISTS educational_experiences,
    DROP COLUMN IF EXISTS personal_experiences,
    DROP COLUMN IF EXISTS skills,
    DROP COLUMN IF EXISTS projects,
    DROP COLUMN IF EXISTS social_networks,
    DROP COLUMN IF EXISTS hobbies;

-- ---- 7. Fix security-definer function in public schema -----
-- Move handle_new_oauth_user to an unexposed internal schema
-- (Supabase security best practice: never put security definer functions in public).

CREATE SCHEMA IF NOT EXISTS internal;

CREATE OR REPLACE FUNCTION internal.handle_new_oauth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF new.raw_app_meta_data->>'provider' = 'email' THEN
        RETURN new;
    END IF;

    INSERT INTO public.users (id, email, first_name, last_name)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'given_name',
        new.raw_user_meta_data->>'family_name'
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION  IF EXISTS public.handle_new_oauth_user();

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE internal.handle_new_oauth_user();
