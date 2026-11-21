import Joi from "joi";

const PERMISSION_TYPES = [
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
];

const PERMISSION_STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

export const submitPermissionSchema = Joi.object({
  type: Joi.string()
    .valid(...PERMISSION_TYPES)
    .required()
    .messages({
      "any.only": `type must be one of: ${PERMISSION_TYPES.join(", ")}`,
      "any.required": "type is required",
    }),

  startDate: Joi.date().iso().required().messages({
    "date.base": "startDate must be a valid ISO date",
    "any.required": "startDate is required",
  }),

  endDate: Joi.date().iso().min(Joi.ref("startDate")).required().messages({
    "date.base": "endDate must be a valid ISO date",
    "date.min": "endDate cannot be before startDate",
    "any.required": "endDate is required",
  }),

  reason: Joi.string().max(500).optional().allow("", null),
});

export const listPermissionsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(100).allow("").optional(),
  type: Joi.string()
    .valid(...PERMISSION_TYPES)
    .optional(),
  status: Joi.string()
    .valid(...PERMISSION_STATUSES)
    .optional(),
});

export const approvePermissionSchema = Joi.object({
  note: Joi.string().max(500).optional().allow("", null),
});

export const rejectPermissionSchema = Joi.object({
  note: Joi.string().max(500).required().messages({
    "string.empty": "note wajib diisi sebagai alasan penolakan",
    "any.required": "note wajib diisi sebagai alasan penolakan",
  }),
});
