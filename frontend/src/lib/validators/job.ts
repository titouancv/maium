import { z } from "zod";

/** Request body for POST /api/analyze-job — URL mode. */
export const AnalyzeJobUrlSchema = z.object({
  mode: z.literal("url"),
  jobUrl: z.url(),
});

/** Request body for POST /api/analyze-job — pasted text mode. */
export const AnalyzeJobTextSchema = z.object({
  mode: z.literal("text"),
  jobText: z.string().min(50),
});

export const AnalyzeJobSchema = z.discriminatedUnion("mode", [
  AnalyzeJobUrlSchema,
  AnalyzeJobTextSchema,
]);
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

/** A single experience/education entry inside a stored `resume_json`. */
const ResumeEntrySchema = z.object({
  organization: z.string().default(""),
  role: z.string().default(""),
  startPeriod: z.number(),
  endPeriod: z.number().optional(),
  location: z.string().optional(),
  description: z.string().default(""),
});

/**
 * A user-edited `resume_json` posted to the PDF endpoint. Used only to render
 * the PDF on the fly — never persisted to the database.
 */
export const ResumeJsonInputSchema = z.object({
  summary: z.string().default(""),
  experiences: z.array(ResumeEntrySchema).default([]),
  education: z.array(ResumeEntrySchema).default([]),
  skills: z.array(z.string()).default([]),
});
export type ResumeJsonInput = z.infer<typeof ResumeJsonInputSchema>;

/** Full match analysis that Mistral provides: dimension scores + explanation. */
export const MatchingExplanationSchema = z.object({
  scores: z.object({
    hard_skills: z.number().min(0).max(1).default(0),
    seniority: z.number().min(0).max(1).default(0),
    semantic: z.number().min(0).max(1).default(0),
    bonus: z.number().min(0).max(1).default(0),
  }),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  missing_skills: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  summary: z.string().default(""),
});
export type MatchingExplanation = z.infer<typeof MatchingExplanationSchema>;

/** Shape Mistral must return when optimizing a resume for a job. */
export const OptimizedResumeSchema = z.object({
  summary: z.string().default(""),
  experiences: z
    .array(
      z.object({
        // 0-based index into the candidate's experiences; dates/location are
        // merged back from that source so the model never invents facts.
        source_index: z.number().int().min(0).default(0),
        organization: z.string().default(""),
        role: z.string().default(""),
        description: z.string().default(""),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        // 0-based index into the candidate's education; dates/location are
        // merged back from that source so the model never invents facts.
        source_index: z.number().int().min(0).default(0),
        organization: z.string().default(""),
        role: z.string().default(""),
        description: z.string().default(""),
      }),
    )
    .default([]),
  skills: z.array(z.string()).default([]),
  ats_score: z.number().min(0).max(100).default(0),
});
export type OptimizedResumeOutput = z.infer<typeof OptimizedResumeSchema>;
