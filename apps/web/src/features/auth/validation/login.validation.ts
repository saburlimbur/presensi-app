import { z } from "zod";

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),

  password: z.string().min(6, "Password is required").max(100),
});

export type LoginFormValues = z.infer<typeof loginUserSchema>;
