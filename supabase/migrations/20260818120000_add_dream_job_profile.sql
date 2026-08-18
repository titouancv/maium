ALTER TABLE public.users
    ADD COLUMN dream_company_types jsonb NOT NULL DEFAULT '[]',
    ADD COLUMN dream_work_mode text
        CHECK (dream_work_mode IN ('remote', 'hybrid', 'onsite', 'flexible')),
    ADD COLUMN dream_location text,
    ADD COLUMN dream_salary integer
        CHECK (dream_salary IS NULL OR dream_salary > 0),
    ADD COLUMN dream_industries jsonb NOT NULL DEFAULT '[]',
    ADD COLUMN dream_company_values text;
