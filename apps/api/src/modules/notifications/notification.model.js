import Joi from "joi";

export const NOTIFICATION_TYPES = [
  "ATTENDANCE_REMINDER",
  "ATTENDANCE_CHECK_IN",
  "ATTENDANCE_CHECK_OUT",
  "PERMISSION_SUBMITTED",
  "PERMISSION_APPROVED",
  "PERMISSION_REJECTED",
  "ANNOUNCEMENT",
  "SYSTEM",
];

export const listNotificationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  unreadOnly: Joi.boolean().default(false),
  type: Joi.string().valid(...NOTIFICATION_TYPES),
});
