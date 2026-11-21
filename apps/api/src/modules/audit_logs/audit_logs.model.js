import Joi from "joi";

export const AUDIT_ACTIONS = {
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_TOGGLED_ACTIVE: "user.toggled_active",
  USER_PASSWORD_RESET: "user.password_reset",
  PERMISSION_APPROVED: "permission.approved",
  PERMISSION_REJECTED: "permission.rejected",
  PERMISSION_CANCELLED: "permission.cancelled",
  ATTENDANCE_MANUAL_CREATED: "attendance.manual_created",
  LEAVE_BALANCE_CREATED: "leave_balance.created",
  LEAVE_BALANCE_UPDATED: "leave_balance.updated",
};

export const listAuditLogsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  userId: Joi.string().guid().optional(),
  action: Joi.string()
    .valid(...Object.values(AUDIT_ACTIONS))
    .optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().min(Joi.ref("dateFrom")).optional(),
});
