import Joi from "joi";

export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  fullName: Joi.string().min(3).max(100).required(),
  phone: Joi.string().min(8).max(20).required(),
  departmentCode: Joi.string().required(),
  joinDate: Joi.date().iso().optional(),
  position: Joi.string()
    .valid(
      "DIRECTOR",
      "MANAGER",
      "SUPERVISOR",
      "TEAM_LEAD",
      "SENIOR_STAFF",
      "STAFF",
      "JUNIOR_STAFF",
      "HR_SPECIALIST",
      "FINANCE_SPECIALIST",
      "IT_SPECIALIST",
      "MARKETING_SPECIALIST",
      "INTERN",
      "CONTRACT",
      "OTHER",
    )
    .required(),
  role: Joi.string().valid("ADMIN", "EMPLOYEE").default("EMPLOYEE"),
});

export const adminUpdateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  fullName: Joi.string().min(3).max(100).optional(),
  phone: Joi.string().min(8).max(20).optional(),
  departmentCode: Joi.string().optional(),
  position: Joi.string()
    .valid(
      "DIRECTOR",
      "MANAGER",
      "SUPERVISOR",
      "TEAM_LEAD",
      "SENIOR_STAFF",
      "STAFF",
      "JUNIOR_STAFF",
      "HR_SPECIALIST",
      "FINANCE_SPECIALIST",
      "IT_SPECIALIST",
      "MARKETING_SPECIALIST",
      "INTERN",
      "CONTRACT",
      "OTHER",
    )
    .optional(),
  role: Joi.string().valid("ADMIN", "EMPLOYEE").optional(),
  isActive: Joi.boolean().optional(),
  password: Joi.string().min(6).max(100).optional(),
})
  .min(1)
  .messages({
    "object.min": "minimal satu field wajib dikirim untuk update",
  });

export const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(100).allow("").optional(),
  departmentId: Joi.string().uuid().optional(),
  role: Joi.string().valid("ADMIN", "EMPLOYEE").optional(),
  isActive: Joi.boolean().optional(),
});

export const registerAdminSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  fullName: Joi.string().min(3).max(100).required(),
  phone: Joi.string().min(8).max(20).required(),
});

export const loginUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(3).max(100).optional(),
  phone: Joi.string().min(8).max(20).optional(),
});

export const updatePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(100).required(),
});


export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().length(64).hex().required(),
  newPassword: Joi.string().min(6).max(100).required(),
});
