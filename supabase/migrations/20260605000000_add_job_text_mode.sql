-- Support pasting raw job text in addition to submitting a URL.
-- source_url becomes nullable in analysis_jobs (text-mode submissions have no URL).
-- job_text stores the raw pasted content for text-mode submissions.

ALTER TABLE public.analysis_jobs
  ALTER COLUMN source_url DROP NOT NULL,
  ADD COLUMN job_text text;
