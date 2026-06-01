import { z } from "zod";

/** Request body for POST /api/analyze-job. */
export const AnalyzeJobSchema = z.object({
  jobUrl: z.url(),
});
export type AnalyzeJobInput = z.infer<typeof AnalyzeJobSchema>;

/** Shape Mistral must return when extracting a job posting from raw text. */
export const JobExtractionSchema = z.object({
  title: z.string().default(""),
  company: z.string().default(""),
  location: z.string().default(""),
  employment_type: z.string().default(""),
  salary: z.string().nullable().default(null),
  description: z.string().default(""),
  requirements: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  seniority: z.string().default(""),
});
export type JobExtraction = z.infer<typeof JobExtractionSchema>;

/** Explanatory part of the match that Mistral provides (never the score). */
export const MatchingExplanationSchema = z.object({
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  missing_skills: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  summary: z.string().default(""),
});
export type MatchingExplanation = z.infer<typeof MatchingExplanationSchema>;

/** Shape Mistral must return when optimizing a resume for a job. */
export const OptimizedResumeSchema = z.object({
  headline: z.string().default(""),
  summary: z.string().default(""),
  experiences: z
    .array(
      z.object({
        organization: z.string().default(""),
        role: z.string().default(""),
        highlights: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  skills: z.array(z.string()).default([]),
  ats_score: z.number().min(0).max(100).default(0),
});
export type OptimizedResumeOutput = z.infer<typeof OptimizedResumeSchema>;
