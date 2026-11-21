import Joi from "joi";

export const createDepartmentSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    "string.min": "Nama departemen minimal 3 karakter",
    "any.required": "Nama departemen wajib diisi",
  }),
  code: Joi.string().min(2).uppercase().required().messages({
    "string.min": "Kode departemen minimal 2 karakter",
    "any.required": "Kode departemen wajib diisi",
  }),
  headId: Joi.string().guid({ version: "uuidv4" }).allow(null).optional(),
});

export const updateDepartmentSchema = Joi.object({
  name: Joi.string().min(3),
  code: Joi.string().min(2).uppercase(),
  headId: Joi.string().guid({ version: "uuidv4" }).allow(null),
}).min(1);

export const listDepartmentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().optional(),
  code: Joi.string().trim().optional(),
  name: Joi.string().trim().optional(),
});
