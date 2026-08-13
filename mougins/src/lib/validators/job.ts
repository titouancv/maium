import { z } from "zod";
import { CvExtractionSchema } from "./cv";

export const AnalyzeJobUrlSchema = z.object({
  mode: z.literal("url"),
  jobUrl: z.url(),
});

export const AnalyzeJobTextSchema = z.object({
  mode: z.literal("text"),
  jobText: z.string().min(50),
});

export const AnalyzeJobSchema = z.discriminatedUnion("mode", [
  AnalyzeJobUrlSchema,
  AnalyzeJobTextSchema,
]);
export type AnalyzeJobInput = z.infer<typeof AnalyzeJobSchema>;

export const AnalyzeJobRequestSchema = z.discriminatedUnion("mode", [
  AnalyzeJobUrlSchema.extend({ cvExtraction: CvExtractionSchema.optional() }),
  AnalyzeJobTextSchema.extend({ cvExtraction: CvExtractionSchema.optional() }),
]);

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

const ResumeEntrySchema = z.object({
  organization: z.string().default(""),
  role: z.string().default(""),
  startPeriod: z.number(),
  endPeriod: z.number().optional(),
  location: z.string().optional(),
  description: z.string().default(""),
});

export const ResumeJsonInputSchema = z.object({
  summary: z.string().default(""),
  experiences: z.array(ResumeEntrySchema).default([]),
  education: z.array(ResumeEntrySchema).default([]),
  skills: z.array(z.string()).default([]),
});

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

export const OptimizedResumeSchema = z.object({
  summary: z.string().default(""),
  experiences: z
    .array(
      z.object({
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

export const CoverLetterSchema = z.object({
  cover_letter: z.string().default(""),
});
