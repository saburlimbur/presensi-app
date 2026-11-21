import Joi from "joi";

const VALID_SHIFT_NAMES = [
  "MORNING",
  "AFTERNOON",
  "NIGHT",
  "FULL_DAY",
  "SPLIT_SHIFT",
  "FLEXIBLE",
];

export const createShiftSchema = Joi.object({
  name: Joi.string()
    .valid(...VALID_SHIFT_NAMES)
    .required()
    .messages({
      "any.only": `name must be one of: ${VALID_SHIFT_NAMES.join(", ")}`,
      "any.required": "name is required",
    }),

  startTime: Joi.date().iso().required().messages({
    "date.base": "startTime must be a valid date/time",
    "any.required": "startTime is required",
  }),

  endTime: Joi.date().iso().required().messages({
    "date.base": "endTime must be a valid date/time",
    "any.required": "endTime is required",
  }),

  gracePeriod: Joi.number().integer().min(0).default(0).messages({
    "number.min": "gracePeriod cannot be negative",
  }),

  isActive: Joi.boolean().default(false),

  description: Joi.string().max(255).optional().allow("", null),
});

export const updateShiftSchema = Joi.object({
  name: Joi.string()
    .valid(...VALID_SHIFT_NAMES)
    .messages({
      "any.only": `name must be one of: ${VALID_SHIFT_NAMES.join(", ")}`,
    }),

  startTime: Joi.date().iso().messages({
    "date.base": "startTime must be a valid date/time",
  }),

  endTime: Joi.date().iso().messages({
    "date.base": "endTime must be a valid date/time",
  }),

  gracePeriod: Joi.number().integer().min(0).messages({
    "number.min": "gracePeriod cannot be negative",
  }),

  isActive: Joi.boolean(),

  description: Joi.string().max(255).optional().allow("", null),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });
