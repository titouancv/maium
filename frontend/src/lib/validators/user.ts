import { z } from "zod";

const optionalUrl = z
  .union([z.url(), z.literal("")])
  .optional()
  .transform((v) => (v ? v : undefined));

const period = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const optionalPeriod = z
  .union([period, z.literal("")])
  .optional()
  .transform((v) => (v ? v : undefined));

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

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  pseudo: z.string().min(2).max(30),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z
  .object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    pseudo: z.string().min(2).max(30).optional(),
    dob: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    onboardingCompleted: z.boolean().optional(),
    professionalExperiences: z.array(ExperienceSchema).optional(),
    educationalExperiences: z.array(ExperienceSchema).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
