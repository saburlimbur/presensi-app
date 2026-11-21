import { validate } from "../../utils/validate.js";
import { safeUnlink } from "../../utils/safe-unlink.js";

import {
  createUserSchema,
  adminUpdateUserSchema,
  listUsersQuerySchema,
  registerAdminSchema,
  loginUserSchema,
  refreshTokenSchema,
  updatePasswordSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./user.model.js";
import userService from "./user.service.js";
import auditLogsService from "../audit_logs/audit_logs.service.js";
import { AUDIT_ACTIONS } from "../audit_logs/audit_logs.model.js";
import logger from "../../utils/logger.js";
import { sendError, BadRequestError } from "../../utils/error.js";
import mailer from "../../lib/mailer.js";
import { env } from "../../config/env.js";

const registerAdmin = async (req, res) => {
  try {
    const value = validate(registerAdminSchema, req.body);
    const user = await userService.registerAdmin(value);

    return res.status(201).json({
      success: true,
      message: "akun admin berhasil dibuat",
      data: user,
    });
  } catch (error) {
    logger.error(`register admin error: ${error.message}`);
    return sendError(res, error);
  }
};

const createUser = async (req, res) => {
  try {
    const value = validate(createUserSchema, req.body);
    const user = await userService.createUser(value);

    auditLogsService.log({
      userId: req.user.id,
      action: AUDIT_ACTIONS.USER_CREATED,
      details: `created ${user.role} ${user.employeeId} (${user.email})`,
    });

    if (mailer.isMailConfigured()) {
      userService
        .adminInitiatePasswordReset(user.id)
        .then(({ token, expiresAt }) =>
          mailer.sendAccountInvitationEmail(user.email, token, expiresAt),
        )
        .catch((err) =>
          logger.error(`kirim email undangan gagal: ${err.message}`),
        );
    }

    return res.status(201).json({
      success: true,
      message: "akun karyawan berhasil dibuat",
      data: user,
    });
  } catch (error) {
    logger.error(`create user employee error: ${error.message}`);
    return sendError(res, error);
  }
};

const loginUser = async (req, res) => {
  try {
    const value = validate(loginUserSchema, req.body);
    const result = await userService.loginUser(value);

    return res.status(200).json({
      success: true,
      message: "login berhasil",
      data: result,
    });
  } catch (error) {
    logger.error(`login error: ${error.message}`);
    return sendError(res, error);
  }
};

const refreshToken = async (req, res) => {
  try {
    const value = validate(refreshTokenSchema, req.body);
    const result = await userService.refreshAccessToken(value.refreshToken);

    return res.status(200).json({
      success: true,
      message: "access token berhasil diperbarui",
      data: result,
    });
  } catch (error) {
    logger.error(`refresh token error: ${error.message}`);
    return sendError(res, error);
  }
};

const logoutUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const refreshToken = req.body.refreshToken;

    await userService.logoutUser(userId, refreshToken);

    return res.status(200).json({
      success: true,
      message: "logout berhasil",
    });
  } catch (error) {
    logger.error(`logout error: ${error.message}`);
    return sendError(res, error);
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.getProfile(userId);

    return res.status(200).json({
      success: true,
      message: "profil berhasil diambil",
      data: user,
    });
  } catch (error) {
    logger.error(`get profile error: ${error.message}`);
    return sendError(res, error);
  }
};

const updateProfile = async (req, res) => {
  try {
    const value = validate(updateProfileSchema, req.body);
    const userId = req.user.id;
    const user = await userService.updateProfile(userId, value);

    return res.status(200).json({
      success: true,
      message: "profil berhasil diperbarui",
      data: user,
    });
  } catch (error) {
    logger.error(`update profile error: ${error.message}`);
    return sendError(res, error);
  }
};

const updateProfilePhoto = async (req, res) => {
  const file = req.file;
  try {
    if (!file) {
      throw new BadRequestError("tidak ada file foto yang diupload.");
    }

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.mimetype)) {
      await safeUnlink(file.path);
      throw new BadRequestError(
        "format file tidak didukung. gunakan jpeg, jpg, atau png.",
      );
    }

    const user = await userService.updateProfilePhoto(req.user.id, file);

    await safeUnlink(file.path);

    return res.status(200).json({
      success: true,
      message: "foto profil berhasil diperbarui.",
      data: user,
    });
  } catch (error) {
    if (file?.path) await safeUnlink(file.path);
    logger.error(`update profile photo error: ${error.message}`);
    return sendError(res, error);
  }
};

const updatePassword = async (req, res) => {
  try {
    const value = validate(updatePasswordSchema, req.body);
    const userId = req.user.id;
    await userService.updatePassword(
      userId,
      value.oldPassword,
      value.newPassword,
    );

    return res.status(200).json({
      success: true,
      message: "password berhasil diperbarui",
    });
  } catch (error) {
    logger.error(`update password error: ${error.message}`);
    return sendError(res, error);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const value = validate(forgotPasswordSchema, req.body);
    const result = await userService.requestPasswordReset(value.email);

    if (result) {
      if (mailer.isMailConfigured()) {
        mailer
          .sendPasswordResetEmail(result.email, result.token, result.expiresAt)
          .catch((err) =>
            logger.error(`kirim email reset gagal: ${err.message}`),
          );
      } else if (env.app.env !== "production") {
        logger.info(
          `[DEV] reset token ${result.email}: ${result.token} (exp ${result.expiresAt.toISOString()})`,
        );
      } else {
        logger.error("reset password diminta tapi SMTP belum dikonfigurasi");
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "jika email terdaftar, instruksi reset password sudah dikirim.",
    });
  } catch (error) {
    logger.error(`forgot password error: ${error.message}`);
    return sendError(res, error);
  }
};

const resetPassword = async (req, res) => {
  try {
    const value = validate(resetPasswordSchema, req.body);
    await userService.resetPasswordWithToken(value.token, value.newPassword);

    return res.status(200).json({
      success: true,
      message:
        "password berhasil direset. silakan login dengan password baru.",
    });
  } catch (error) {
    logger.error(`reset password error: ${error.message}`);
    return sendError(res, error);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const value = validate(listUsersQuerySchema, req.query);

    const result = await userService.getAllUsers(value);

    return res.status(200).json({
      success: true,
      message: "daftar karyawan berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error(`get all users employee error: ${error.message}`);
    return sendError(res, error);
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    return res.status(200).json({
      success: true,
      message: "detail karyawan berhasil diambil",
      data: user,
    });
  } catch (error) {
    logger.error(`get user by id error: ${error.message}`);
    return sendError(res, error);
  }
};

const toggleActiveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.toggleActiveUser(id, req.user.id);

    auditLogsService.log({
      userId: req.user.id,
      action: AUDIT_ACTIONS.USER_TOGGLED_ACTIVE,
      details: `${user.isActive ? "enabled" : "disabled"} user ${user.employeeId} (${user.email})`,
    });

    return res.status(200).json({
      success: true,
      message: `akun user berhasil ${user.isActive ? "diaktifkan" : "dinonaktifkan"}`,
      data: {
        id: user.id,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    logger.error(`toggle active user error: ${error.message}`);
    return sendError(res, error);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const value = validate(adminUpdateUserSchema, req.body);
    const user = await userService.adminUpdateUser(id, value, req.user.id);

    auditLogsService.log({
      userId: req.user.id,
      action: AUDIT_ACTIONS.USER_UPDATED,
      details: `updated user ${user.employeeId} (${user.email})`,
    });

    return res.status(200).json({
      success: true,
      message: "data karyawan berhasil diperbarui",
      data: user,
    });
  } catch (error) {
    logger.error(`admin update user error: ${error.message}`);
    return sendError(res, error);
  }
};

const adminResetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userService.adminInitiatePasswordReset(id);

    auditLogsService.log({
      userId: req.user.id,
      action: AUDIT_ACTIONS.USER_PASSWORD_RESET,
      details: `initiate reset password ${result.employeeId} (${result.email})`,
    });

    return res.status(200).json({
      success: true,
      message:
        "link reset berhasil dibuat. serahkan ke karyawan untuk mengatur password sendiri.",
      data: result,
    });
  } catch (error) {
    logger.error(`admin reset password error: ${error.message}`);
    return sendError(res, error);
  }
};

export default {
  registerAdmin,
  createUser,
  loginUser,
  refreshToken,
  logoutUser,
  getProfile,
  updateProfile,
  updateProfilePhoto,
  updatePassword,
  forgotPassword,
  resetPassword,
  getAllUsers,
  getUserById,
  updateUser,
  toggleActiveUser,
  adminResetPassword,
};
