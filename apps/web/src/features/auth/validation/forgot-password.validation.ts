import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
