CREATE FUNCTION public.count_company_contacts(p_company text)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT count(DISTINCT u.id)::int
    FROM public.user_experiences e
    JOIN public.users u ON u.id = e.user_id
    WHERE e.type = 'professional'
      AND u.onboarding_completed
      AND public.normalize_company(p_company) <> ''
      AND public.normalize_company(e.organization) = public.normalize_company(p_company);
$$;

GRANT EXECUTE ON FUNCTION public.count_company_contacts(text) TO service_role, authenticated;
