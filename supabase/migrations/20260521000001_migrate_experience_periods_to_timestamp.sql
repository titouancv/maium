-- Migrate startPeriod / endPeriod inside experience JSONB arrays
-- from ISO strings ("YYYY-MM" or "YYYY") to millisecond Unix timestamps.
--
-- The dob column (type date) is unchanged: the API already converts
-- the client-side timestamp to an ISO date string before writing to the DB.

create or replace function _migrate_experience_periods(experiences jsonb)
returns jsonb
language plpgsql
as $$
declare
  result  jsonb := '[]'::jsonb;
  elem    jsonb;
  s       text;
  e       text;
begin
  if experiences is null or jsonb_array_length(experiences) = 0 then
    return experiences;
  end if;

  for elem in select * from jsonb_array_elements(experiences)
  loop
    s := elem->>'startPeriod';
    e := elem->>'endPeriod';

    if s ~ '^\d{4}-\d{2}$' then
      elem := elem || jsonb_build_object(
        'startPeriod',
        (extract(epoch from (s || '-01')::date)::bigint * 1000)
      );
    elsif s ~ '^\d{4}$' then
      elem := elem || jsonb_build_object(
        'startPeriod',
        (extract(epoch from (s || '-01-01')::date)::bigint * 1000)
      );
    end if;

    if e ~ '^\d{4}-\d{2}$' then
      elem := elem || jsonb_build_object(
        'endPeriod',
        (extract(epoch from (e || '-01')::date)::bigint * 1000)
      );
    elsif e ~ '^\d{4}$' then
      elem := elem || jsonb_build_object(
        'endPeriod',
        (extract(epoch from (e || '-01-01')::date)::bigint * 1000)
      );
    end if;

    result := result || jsonb_build_array(elem);
  end loop;

  return result;
end;
$$;

update public.users
set
  professional_experiences = _migrate_experience_periods(professional_experiences),
  educational_experiences  = _migrate_experience_periods(educational_experiences),
  personal_experiences     = _migrate_experience_periods(personal_experiences)
where
  professional_experiences != '[]'::jsonb
  or educational_experiences  != '[]'::jsonb
  or personal_experiences     != '[]'::jsonb;

drop function _migrate_experience_periods(jsonb);
