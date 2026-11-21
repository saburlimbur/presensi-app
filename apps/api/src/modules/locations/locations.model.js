import Joi from "joi";

export const createLocationSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.min": "nama lokasi minimal 3 karakter",
    "string.max": "nama lokasi maksimal 100 karakter",
    "any.required": "nama lokasi wajib diisi",
  }),
  address: Joi.string().max(255).optional().allow("", null),
  latitude: Joi.number().min(-90).max(90).required().messages({
    "number.min": "latitude harus antara -90 sampai 90",
    "number.max": "latitude harus antara -90 sampai 90",
    "any.required": "latitude wajib diisi",
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    "number.min": "longitude harus antara -180 sampai 180",
    "number.max": "longitude harus antara -180 sampai 180",
    "any.required": "longitude wajib diisi",
  }),
  radius: Joi.number().integer().min(1).max(10000).required().messages({
    "number.min": "radius minimal 1 meter",
    "number.max": "radius maksimal 10000 meter",
    "any.required": "radius wajib diisi",
  }),
  isActive: Joi.boolean().default(true),
});

export const updateLocationSchema = Joi.object({
  name: Joi.string().min(3).max(100),
  address: Joi.string().max(255).allow("", null),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  radius: Joi.number().integer().min(1).max(10000),
  isActive: Joi.boolean(),
})
  .min(1)
  .messages({
    "object.min": "minimal satu field wajib dikirim untuk update",
  });

export const listLocationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow("", null),
  isActive: Joi.boolean(),
});
