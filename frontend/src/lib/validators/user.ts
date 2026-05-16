import { z } from "zod";

const optionalUrl = z
  .union([z.string().url(), z.literal("")])
  .optional()
  .transform((v) => (v ? v : undefined));

const monthYear = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const year = z.string().regex(/^\d{4}$/);

export const ProfessionalExperienceSchema = z
  .object({
    company: z.string().min(1).max(120),
    role: z.string().min(1).max(120),
    description: z.string().max(500).optional(),
    website: optionalUrl,
    startDate: monthYear,
    endDate: monthYear.optional(),
    current: z.boolean(),
  })
  .refine((d) => d.current || !!d.endDate, {
    message: "End date required when not current",
    path: ["endDate"],
  })
  .refine((d) => !d.endDate || d.endDate >= d.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type ProfessionalExperienceInput = z.infer<
  typeof ProfessionalExperienceSchema
>;

export const EducationalExperienceSchema = z
  .object({
    school: z.string().min(1).max(120),
    fieldOfStudy: z.string().min(1).max(120),
    description: z.string().max(500).optional(),
    website: optionalUrl,
    startYear: year,
    endYear: year.optional(),
  })
  .refine((d) => !d.endYear || Number(d.endYear) >= Number(d.startYear), {
    message: "End year must be after start year",
    path: ["endYear"],
  });

export type EducationalExperienceInput = z.infer<
  typeof EducationalExperienceSchema
>;

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
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    onboardingCompleted: z.boolean().optional(),
    professionalExperiences: z.array(ProfessionalExperienceSchema).optional(),
    educationalExperiences: z.array(EducationalExperienceSchema).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
