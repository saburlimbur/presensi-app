import Joi from "joi";
import { inJakarta } from "../../utils/date.js";

export const DEFAULT_ANNUAL_QUOTA = 12;

export const LEAVE_DEDUCTING_TYPES = [
  "ANNUAL_LEAVE",
  "MATERNITY_LEAVE",
  "PATERNITY_LEAVE",
  "MARRIAGE_LEAVE",
  "BEREAVEMENT",
];

const currentYear = () => inJakarta(new Date()).year();

export const createLeaveBalanceSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  year: Joi.number()
    .integer()
    .min(2000)
    .max(2100)
    .default(currentYear),
  annualQuota: Joi.number().integer().min(0).default(DEFAULT_ANNUAL_QUOTA),
  carryOverDays: Joi.number().integer().min(0).default(0),
});

export const updateLeaveBalanceSchema = Joi.object({
  annualQuota: Joi.number().integer().min(0).optional(),
  carryOverDays: Joi.number().integer().min(0).optional(),
}).min(1);

export const listLeaveBalanceSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow("", null).optional(),
  userId: Joi.string().uuid().optional(),
  year: Joi.number()
    .integer()
    .min(2000)
    .max(2100)
    .optional(),
});

export const myBalanceQuerySchema = Joi.object({
  year: Joi.number()
    .integer()
    .min(2000)
    .max(2100)
    .default(currentYear),
});
