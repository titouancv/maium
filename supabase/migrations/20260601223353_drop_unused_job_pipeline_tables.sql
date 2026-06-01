-- Drop tables that are not referenced anywhere in the frontend (src/).
-- These belong to the job-analysis / CV-optimization / LLM pipeline, which the
-- Next.js app never queries. The frontend only uses: users, conversations,
-- conversation_members, messages, user_follows, user_experiences, user_hobbies,
-- user_skills, user_projects, user_social_networks.
--
-- CASCADE removes dependent FKs/views/policies. Order is children-first as a
-- belt-and-suspenders, but CASCADE makes ordering irrelevant.

DROP TABLE IF EXISTS public.workflow_events CASCADE;
DROP TABLE IF EXISTS public.resume_versions CASCADE;
DROP TABLE IF EXISTS public.optimized_resumes CASCADE;
DROP TABLE IF EXISTS public.optimized_cvs CASCADE;
DROP TABLE IF EXISTS public.llm_requests CASCADE;
DROP TABLE IF EXISTS public.job_analyses CASCADE;
DROP TABLE IF EXISTS public.user_jobs CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.cached_jobs CASCADE;
