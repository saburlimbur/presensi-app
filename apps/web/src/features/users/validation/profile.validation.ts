import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(3, "Nama minimal 3 karakter").max(100),
  phone: z.string().min(8, "Nomor telepon minimal 8 digit").max(20),
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;

export const updatePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Password lama wajib diisi"),
    newPassword: z.string().min(6, "Password baru minimal 6 karakter").max(100),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  });

export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;
