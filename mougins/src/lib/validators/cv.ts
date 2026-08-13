import { z } from "zod";

export const CV_LIMITS = {
  experiences: 30,
  skills: 60,
  urls: 30,
  hobbies: 20,
} as const;

const modelString = z
  .string()
  .nullish()
  .transform((v) => v ?? "");

const modelArray = <T extends z.ZodTypeAny>(item: T) =>
  z
    .array(item)
    .nullish()
    .transform((v) => v ?? []);

const RawExperienceSchema = z.object({
  organization: modelString,
  role: modelString,
  description: modelString,
  location: modelString,
  startPeriod: modelString,
  endPeriod: modelString,
});

const RawHobbySchema = z.object({
  title: modelString,
  description: modelString,
});

export const CvExtractionRawSchema = z.object({
  firstName: modelString,
  lastName: modelString,
  phone: modelString,
  nationality: modelString,
  location: modelString,
  bio: modelString,
  professionalExperiences: modelArray(RawExperienceSchema),
  educationalExperiences: modelArray(RawExperienceSchema),
  personalExperiences: modelArray(RawExperienceSchema),
  skills: modelArray(modelString),
  projects: modelArray(modelString),
  socialNetworks: modelArray(modelString),
  hobbies: modelArray(RawHobbySchema),
});

export type CvExtractionRaw = z.infer<typeof CvExtractionRawSchema>;

export interface CvExperience {
  organization: string;
  role: string;
  description?: string;
  location?: string;
  startPeriod: number;
  endPeriod?: number;
}

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
