import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Password minimal 6 karakter").max(100),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
