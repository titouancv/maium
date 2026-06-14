-- Add a required (onboarding-gated) gender field to users.
-- The column is nullable at the DB level (like pseudo/dob) and enforced as
-- required by the signup wizard; new OAuth rows start NULL and get gated.
alter table public.users
  add column if not exists gender text
    check (gender in ('male', 'female', 'other'));

-- Existing accounts default to "male" (homme), as requested.
update public.users set gender = 'male' where gender is null;
