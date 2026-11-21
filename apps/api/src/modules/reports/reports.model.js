import Joi from "joi";

export const monthlyAttendanceQuerySchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required().messages({
    "any.required": "month wajib diisi (1-12)",
    "number.min": "month minimal 1",
    "number.max": "month maksimal 12",
  }),
  year: Joi.number().integer().min(2020).max(2100).required().messages({
    "any.required": "year wajib diisi",
  }),
  departmentId: Joi.string().guid().optional(),
  userId: Joi.string().guid().optional(),
});

export const weeklyAttendanceQuerySchema = Joi.object({
  weekStart: Joi.date().required().messages({
    "any.required": "weekStart wajib diisi (format YYYY-MM-DD)",
    "date.base": "weekStart harus tanggal valid",
  }),
  departmentId: Joi.string().guid().optional(),
  userId: Joi.string().guid().optional(),
});

export const rangeAttendanceQuerySchema = Joi.object({
  from: Joi.date().required().messages({
    "any.required": "from wajib diisi (format YYYY-MM-DD)",
    "date.base": "from harus tanggal valid",
  }),
  to: Joi.date().min(Joi.ref("from")).required().messages({
    "any.required": "to wajib diisi (format YYYY-MM-DD)",
    "date.base": "to harus tanggal valid",
    "date.min": "to harus >= from",
  }),
  departmentId: Joi.string().guid().optional(),
  userId: Joi.string().guid().optional(),
});
