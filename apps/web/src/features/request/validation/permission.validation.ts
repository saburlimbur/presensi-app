import { z } from "zod";

export const PERMISSION_TYPES = [
  "SICK",
  "PERMIT",
  "ANNUAL_LEAVE",
  "MATERNITY_LEAVE",
  "PATERNITY_LEAVE",
  "MARRIAGE_LEAVE",
  "BEREAVEMENT",
  "HALF_DAY",
  "WORK_FROM_HOME",
  "OTHER",
] as const;

export type PermissionType = (typeof PERMISSION_TYPES)[number];

export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
export const ACCEPTED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

const isValidDateStr = (val: string) => !isNaN(new Date(val).getTime());

export const createPermissionSchema = z
  .object({
    type: z.enum(PERMISSION_TYPES),

    startDate: z
      .string()
      .min(1, "Tanggal mulai harus diisi")
      .refine(isValidDateStr, "Tanggal mulai tidak valid"),

    endDate: z
      .string()
      .min(1, "Tanggal akhir harus diisi")
      .refine(isValidDateStr, "Tanggal akhir tidak valid"),

    reason: z
      .string()
      .max(500, "Alasan maksimal 500 karakter")
      .optional()
      .transform((val) => (val === "" ? undefined : val)),

    permission_attachment: z
      .instanceof(File)
      .optional()
      .refine((f) => !f || f.size <= MAX_ATTACHMENT_SIZE, {
        message: "Ukuran lampiran maksimal 5 MB",
      })
      .refine(
        (f) =>
          !f ||
          ACCEPTED_ATTACHMENT_TYPES.includes(
            f.type as (typeof ACCEPTED_ATTACHMENT_TYPES)[number],
          ),
        { message: "Format lampiran harus JPG, PNG, WEBP, atau PDF" },
      ),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "Tanggal akhir tidak boleh sebelum tanggal mulai",
    path: ["endDate"],
  });
