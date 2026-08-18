import { z } from "zod";
import {
  DREAM_COMPANY_TYPES,
  DREAM_WORK_MODES,
  GENDERS,
  LOCALES,
  MIN_SIGNUP_AGE,
  PSEUDO_MAX_LENGTH,
  PSEUDO_MIN_LENGTH,
  PSEUDO_REGEX,
} from "@/constants";
import { isAtLeastYearsOld } from "@/lib/date";

const optionalUrl = z
  .union([z.url(), z.literal("")])
  .optional()
  .transform((v) => (v ? v : undefined));

const period = z.number().int();
const optionalPeriod = z
  .number()
  .int()
  .optional()
  .nullable()
  .transform((v) => v ?? undefined);

const ExperienceSchema = z
  .object({
    organization: z.string().min(1).max(120),
    role: z.string().min(1).max(120),
    description: z.string().optional(),
    website: optionalUrl,
    location: z.string().max(100).optional(),
    startPeriod: period,
    endPeriod: optionalPeriod,
  })
  .refine((d) => !d.endPeriod || d.endPeriod >= d.startPeriod, {
    message: "End period must be after start period",
    path: ["endPeriod"],
  });

const HobbySchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string(),
});

export const UpdateUserSchema = z
  .object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    pseudo: z
      .string()
      .min(PSEUDO_MIN_LENGTH)
      .max(PSEUDO_MAX_LENGTH)
      .regex(PSEUDO_REGEX)
      .optional(),
    dob: z
      .number()
      .int()
      .refine((v) => isAtLeastYearsOld(v, MIN_SIGNUP_AGE), {
        message: `Must be at least ${MIN_SIGNUP_AGE} years old`,
      })
      .optional(),
    gender: z.enum(GENDERS).optional(),
    onboardingCompleted: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    locale: z.enum(LOCALES).optional(),
    professionalExperiences: z.array(ExperienceSchema).optional(),
    educationalExperiences: z.array(ExperienceSchema).optional(),
    phone: z.string().nullable().optional(),
    nationality: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    profilePhoto: z
      .union([z.url(), z.literal("")])
      .nullable()
      .optional(),
    socialNetworks: z.array(z.string().url()).optional(),
    hobbies: z.array(HobbySchema).optional(),
    personalExperiences: z.array(ExperienceSchema).optional(),
    skills: z.array(z.string().min(1).max(50)).optional(),
    projects: z.array(z.string().url()).optional(),
    dreamCompanyTypes: z.array(z.enum(DREAM_COMPANY_TYPES)).optional(),
    dreamWorkMode: z.enum(DREAM_WORK_MODES).nullable().optional(),
    dreamLocation: z.string().max(150).nullable().optional(),
    dreamSalary: z.number().int().positive().nullable().optional(),
    dreamIndustries: z.array(z.string().min(1).max(50)).optional(),
    dreamCompanyValues: z.string().max(300).nullable().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
