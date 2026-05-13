import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  pseudo: z.string().min(2).max(30),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
