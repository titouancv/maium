import { z } from "zod";

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

export const ExperienceSchema = z
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

export type ExperienceInput = z.infer<typeof ExperienceSchema>;

type TranslateFn = (key: string) => string;

export function makeExperienceFormSchema(t: TranslateFn) {
  return z
    .object({
      organization: z.string().min(1, t("organizationRequired")).max(120),
      role: z.string().min(1, t("roleRequired")).max(120),
      startPeriod: z
        .number()
        .nullable()
        .refine((v) => v !== null, { message: t("startPeriodRequired") })
        .transform((v) => v as number),
      endPeriod: z
        .number()
        .int()
        .optional()
        .nullable()
        .transform((v) => v ?? undefined),
      description: z.string().or(z.literal("")),
      website: z.union([
        z.url({ message: t("websiteInvalid") }),
        z.literal(""),
      ]),
      location: z.string().max(100).or(z.literal("")),
    })
    .refine((d) => !d.endPeriod || d.endPeriod >= d.startPeriod, {
      message: t("endPeriodBeforeStart"),
      path: ["endPeriod"],
    });
}

export const HobbySchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string(),
});

export const UpdateUserSchema = z
  .object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    pseudo: z.string().min(2).max(30).optional(),
    dob: z.number().int().optional(),
    onboardingCompleted: z.boolean().optional(),
    professionalExperiences: z.array(ExperienceSchema).optional(),
    educationalExperiences: z.array(ExperienceSchema).optional(),
    phone: z.string().nullable().optional(),
    nationality: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    socialNetworks: z.array(z.string().url()).optional(),
    hobbies: z.array(HobbySchema).optional(),
    personalExperiences: z.array(ExperienceSchema).optional(),
    skills: z.array(z.string().min(1).max(50)).optional(),
    projects: z.array(z.string().url()).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
