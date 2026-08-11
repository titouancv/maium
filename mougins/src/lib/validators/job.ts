import { z } from "zod";
import { CvExtractionSchema } from "./cv";

/** The job-offer form — URL mode. */
export const AnalyzeJobUrlSchema = z.object({
  mode: z.literal("url"),
  jobUrl: z.url(),
});

/** The job-offer form — pasted text mode. */
export const AnalyzeJobTextSchema = z.object({
  mode: z.literal("text"),
  jobText: z.string().min(50),
});

export const AnalyzeJobSchema = z.discriminatedUnion("mode", [
  AnalyzeJobUrlSchema,
  AnalyzeJobTextSchema,
]);
export type AnalyzeJobInput = z.infer<typeof AnalyzeJobSchema>;

/**
 * Full request body for `POST /api/analyze-job`: the form fields above plus,
 * for a signed-out run, the CV parsed at `/api/cv/parse`.
 *
 * Kept separate from the form schemas so react-hook-form keeps validating only
 * what the user actually types — the CV is attached by the page at submit time.
 * It has crossed a trust boundary by then, so it is re-validated in full rather
 * than taken on the client's word. Ignored for a signed-in caller, whose stored
 * profile wins.
 */
export const AnalyzeJobRequestSchema = z.discriminatedUnion("mode", [
  AnalyzeJobUrlSchema.extend({ cvExtraction: CvExtractionSchema.optional() }),
  AnalyzeJobTextSchema.extend({ cvExtraction: CvExtractionSchema.optional() }),
]);

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

/** Shape Mistral must return when writing a cover letter for a job. */
export const CoverLetterSchema = z.object({
  cover_letter: z.string().default(""),
});
