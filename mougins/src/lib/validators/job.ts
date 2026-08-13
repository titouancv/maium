import { z } from "zod";
import { ANALYSIS_NOTES_CHAR_LIMIT, ANALYSIS_SNOOZE_DAYS } from "@/constants";
import {
  APPLICATION_STATUSES,
  PREP_POINT_KINDS,
  PREP_RESOURCE_KINDS,
} from "@/types/job";
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

function toPlainString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      if (typeof nested === "string" && nested.trim()) return nested;
    }
  }
  return "";
}

function toEnumToken(value: unknown): unknown {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

const LlmString = z.preprocess(toPlainString, z.string());

export const PrepPointSchema = z.preprocess(
  (value) =>
    typeof value === "string"
      ? { title: value, detail: value, resource_query: value }
      : value,
  z.object({
    title: LlmString,
    detail: LlmString,
    kind: z.preprocess(toEnumToken, z.enum(PREP_POINT_KINDS)).catch("technical"),
    resource_query: LlmString,
    resource_kind: z
      .preprocess(toEnumToken, z.enum(PREP_RESOURCE_KINDS))
      .catch("video"),
  }),
);

export const MatchingExplanationSchema = z.object({
  scores: z.object({
    hard_skills: z.number().min(0).max(1).default(0),
    seniority: z.number().min(0).max(1).default(0),
    semantic: z.number().min(0).max(1).default(0),
    bonus: z.number().min(0).max(1).default(0),
  }),
  prep_points: z.array(PrepPointSchema).catch([]),
  recruiter_questions: z
    .array(LlmString)
    .catch([])
    .transform((questions) =>
      questions.map((question) => question.trim()).filter(Boolean),
    ),
  summary: LlmString.catch(""),
});
export type MatchingExplanation = z.infer<typeof MatchingExplanationSchema>;

export const UpdateAnalysisTrackingSchema = z
  .object({
    status: z.enum(APPLICATION_STATUSES).optional(),
    snooze_days: z.literal(ANALYSIS_SNOOZE_DAYS).nullable().optional(),
    notes: z.string().max(ANALYSIS_NOTES_CHAR_LIMIT).nullable().optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0);
export type UpdateAnalysisTracking = z.infer<
  typeof UpdateAnalysisTrackingSchema
>;

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
