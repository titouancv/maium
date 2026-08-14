ALTER TABLE public.analysis_jobs
    ADD COLUMN locale text NOT NULL DEFAULT 'en'
        CHECK (locale IN ('en', 'fr'));

ALTER TABLE public.analyses
    ADD COLUMN locale text NOT NULL DEFAULT 'en'
        CHECK (locale IN ('en', 'fr'));

ALTER TABLE public.optimized_resumes
    ADD COLUMN language text NOT NULL DEFAULT 'en'
        CHECK (language IN ('en', 'fr'));
