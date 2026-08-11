import { z } from "zod";

/**
 * Hard caps on how much a single CV may yield.
 *
 * These are a **security control**, not just tidiness: a CV is attacker-supplied
 * text, and a prompt injection inside one can make the model emit hundreds of
 * fabricated entries. The normalizer truncates to these numbers and the schema
 * rejects above them, so the two agree by construction — anything
 * `normalizeCvExtraction` returns is accepted by `CvExtractionSchema`.
 */
export const CV_LIMITS = {
  experiences: 30,
  skills: 60,
  urls: 30,
  hobbies: 20,
} as const;

/**
 * Shape the model is asked to return for one experience. Periods are partial
 * calendar dates (`YYYY-MM` / `YYYY`) because models emit those reliably and
 * epoch timestamps badly; they are converted to epoch ms server-side by
 * `cvExtractionToProfileDraft` (see lib/cv/parse.ts).
 */
const RawExperienceSchema = z.object({
  organization: z.string(),
  role: z.string(),
  description: z.string().default(""),
  location: z.string().default(""),
  /** `YYYY-MM` or `YYYY`. Empty when the CV doesn't say. */
  startPeriod: z.string().default(""),
  /** Same format; empty for an ongoing role. */
  endPeriod: z.string().default(""),
});

const RawHobbySchema = z.object({
  title: z.string(),
  description: z.string().default(""),
});

/**
 * Raw LLM output for a parsed CV. Deliberately permissive — the model is told
 * to use empty strings/arrays for anything absent, and every field is
 * normalized (trimmed, date-converted, invalid entries dropped) before it
 * reaches the caller. Validating loosely here and tightening in the normalizer
 * keeps a single missing field from failing the whole parse.
 *
 * Note what is *not* extracted: `pseudo`, `email`, `dob` and `gender` are
 * identity / uniqueness fields the user must confirm themselves, and there is
 * no languages field in the data model.
 */
export const CvExtractionRawSchema = z.object({
  firstName: z.string().default(""),
  lastName: z.string().default(""),
  phone: z.string().default(""),
  nationality: z.string().default(""),
  location: z.string().default(""),
  bio: z.string().default(""),
  professionalExperiences: z.array(RawExperienceSchema).default([]),
  educationalExperiences: z.array(RawExperienceSchema).default([]),
  personalExperiences: z.array(RawExperienceSchema).default([]),
  skills: z.array(z.string()).default([]),
  projects: z.array(z.string()).default([]),
  socialNetworks: z.array(z.string()).default([]),
  hobbies: z.array(RawHobbySchema).default([]),
});

export type CvExtractionRaw = z.infer<typeof CvExtractionRawSchema>;

/**
 * An experience as carried by a normalized extraction: periods are epoch ms,
 * matching `user_experiences.start_period` / `end_period` and the
 * `ExperienceSchema` accepted by `PATCH /api/users/me`.
 */
export interface CvExperience {
  organization: string;
  role: string;
  description?: string;
  location?: string;
  startPeriod: number;
  endPeriod?: number;
}

/**
 * A CV parsed into the shape `PATCH /api/users/me` accepts — a strict subset of
 * `UpdateUserSchema` (see validators/user.ts). Every field is optional: only
 * what the CV actually yielded is present, so the caller can merge it into an
 * existing profile without blanking anything.
 */
export interface CvExtraction {
  firstName?: string;
  lastName?: string;
  phone?: string;
  nationality?: string;
  location?: string;
  bio?: string;
  professionalExperiences?: CvExperience[];
  educationalExperiences?: CvExperience[];
  personalExperiences?: CvExperience[];
  skills?: string[];
  projects?: string[];
  socialNetworks?: string[];
  hobbies?: { title: string; description: string }[];
}

/**
 * Runtime schema for a `CvExtraction` crossing a trust boundary — the anonymous
 * `/analyze` flow posts one back to `POST /api/analyze-job`, so it cannot be
 * taken on faith. Mirrors the constraints of `UpdateUserSchema` so anything
 * that validates here is also accepted by `PATCH /api/users/me`.
 */
const ExperienceSchema = z
  .object({
    organization: z.string().min(1).max(120),
    role: z.string().min(1).max(120),
    description: z.string().max(4000).optional(),
    location: z.string().max(100).optional(),
    startPeriod: z.number().int(),
    endPeriod: z.number().int().optional(),
  })
  .refine((d) => !d.endPeriod || d.endPeriod >= d.startPeriod, {
    message: "End period must be after start period",
    path: ["endPeriod"],
  });

export const CvExtractionSchema: z.ZodType<CvExtraction> = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().max(40).optional(),
  nationality: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  bio: z.string().max(4000).optional(),
  professionalExperiences: z.array(ExperienceSchema).max(CV_LIMITS.experiences).optional(),
  educationalExperiences: z.array(ExperienceSchema).max(CV_LIMITS.experiences).optional(),
  personalExperiences: z.array(ExperienceSchema).max(CV_LIMITS.experiences).optional(),
  skills: z.array(z.string().min(1).max(50)).max(CV_LIMITS.skills).optional(),
  projects: z.array(z.url()).max(CV_LIMITS.urls).optional(),
  socialNetworks: z.array(z.url()).max(CV_LIMITS.urls).optional(),
  hobbies: z
    .array(
      z.object({
        title: z.string().min(1).max(100),
        description: z.string().max(1000),
      }),
    )
    .max(CV_LIMITS.hobbies)
    .optional(),
});
