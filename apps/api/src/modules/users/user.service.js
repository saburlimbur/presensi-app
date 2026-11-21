import userRepository from "./user.repository.js";
import { paginationMeta } from "../../utils/pagination.js";

import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import fsp from "fs/promises";
import tokens from "../../lib/tokens.js";
import logger from "../../utils/logger.js";
import { env } from "../../config/env.js";
import { uploadObject, removeObject, createSignedUrl } from "../../lib/storage.js";
import faceService from "../faces/face.service.js";
import {
  isUniqueViolation,
  NotFoundError,
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../../utils/error.js";
import { toUtcDayStart } from "../../utils/date.js";
import {
  EmailAlreadyExistsError,
  DepartmentNotFoundError,
  EmployeeIdAllocationError,
  InvalidResetTokenError,
} from "./errors/user.error.js";
import leaveBalanceService from "../leave-balances/leave-balance.service.js";

const { stripPassword, generateAccessToken, generateRefreshToken } = tokens;

const generateNextEmployeeId = async () => {
  const lastEmployeeId = await userRepository.findLastEmployeeId();
  let nextNumber = 1;
  if (lastEmployeeId) {
    const lastNumber = parseInt(lastEmployeeId.split("-")[1], 10);
    nextNumber = lastNumber + 1;
  }
  return `EMP-${String(nextNumber).padStart(3, "0")}`;
};

const registerAdmin = async (payload) => {
  const adminCount = await userRepository.countByRole("ADMIN");
  if (adminCount > 0) {
    throw new ConflictError(
      "admin sudah terdaftar. registrasi admin tidak diizinkan.",
    );
  }

  const { email, password, fullName, phone } = payload;

  const emailExist = await userRepository.isEmailExist(email);
  if (emailExist) throw new EmailAlreadyExistsError();

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userRepository.create({
    email,
    password: hashedPassword,
    fullName,
    phone,
    employeeId: "ADM-001",
    position: "DIRECTOR",
    role: "ADMIN",
    isActive: true,
  });

  return stripPassword(user);
};

const createUser = async (payload) => {
  const { email, password, departmentCode, ...rest } = payload;

  const emailExist = await userRepository.isEmailExist(email);
  if (emailExist) throw new EmailAlreadyExistsError();

  const department = await userRepository.findDepartmentByCode(departmentCode);
  if (!department) throw new DepartmentNotFoundError(departmentCode);

  const hashedPassword = await bcrypt.hash(password, 10);

  const joinDate = toUtcDayStart(payload.joinDate ?? new Date());

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const employeeId = await generateNextEmployeeId();

    try {
      const user = await userRepository.create({
        email,
        employeeId,
        password: hashedPassword,
        departmentId: department.id,
        ...rest,
        joinDate,
        role: payload.role ?? "EMPLOYEE",
        isFaceRegistered: false,
        isActive: true,
      });

      try {
        await leaveBalanceService.initForUser(user.id);
      } catch (err) {
        logger.warn(`init leave balance failed for ${user.id}: ${err.message}`);
      }

      return stripPassword(user);
    } catch (err) {
      if (isUniqueViolation(err, ["employeeId"])) {
        continue;
      }
      throw err;
    }
  }

  throw new EmployeeIdAllocationError();
};

const loginUser = async (payload) => {
  const { email, password } = payload;

  const user = await userRepository.findByEmail(email);
  if (!user) throw new UnauthorizedError("email atau password salah");

  if (!user.isActive)
    throw new UnauthorizedError("akun tidak aktif. silakan hubungi admin.");

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid)
    throw new UnauthorizedError("email atau password salah");

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await userRepository.createRefreshToken(user.id, refreshToken, expiresAt);

  return {
    user: await signProfilePhoto(stripPassword(user)),
    accessToken,
    refreshToken,
  };
};

const refreshAccessToken = async (refreshToken) => {
  try {
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new UnauthorizedError(
      "refresh token tidak valid atau sudah kedaluwarsa",
    );
  }

  const stored = await userRepository.findRefreshToken(refreshToken);
  if (!stored) throw new UnauthorizedError("refresh token tidak ditemukan");

  if (stored.expiresAt < new Date()) {
    await userRepository.deleteRefreshToken(refreshToken);
    throw new UnauthorizedError(
      "refresh token sudah kedaluwarsa, silakan login kembali",
    );
  }

  const user = stored.user;
  const newAccessToken = generateAccessToken(user);

  return {
    accessToken: newAccessToken,
    isFaceRegistered: user.isFaceRegistered,
  };
};

const logoutUser = async (userId, refreshToken) => {
  if (refreshToken) {
    await userRepository.deleteRefreshToken(refreshToken);
  } else {
    await userRepository.deleteAllRefreshTokens(userId);
  }
};

const signProfilePhoto = async (user) => {
  if (!user.profilePhoto) return user;

  try {
    user.profilePhoto_url = await createSignedUrl(
      env.supabase.bucketProfile,
      user.profilePhoto,
      3600,
    );
  } catch (err) {
    logger.warn(`gagal sign profile photo ${user.profilePhoto}: ${err.message}`);
    user.profilePhoto_url = null;
  }

  return user;
};

const getProfile = async (userId) => {
  const user = await userRepository.findProfileById(userId);
  await signProfilePhoto(user);
  if (user.faceEmbeddings?.length) {
    await faceService.signEmbeddings(user.faceEmbeddings);
  }
  return user;
};

const updateProfile = async (userId, payload) => {
  const user = await userRepository.update(userId, payload);
  return await signProfilePhoto(stripPassword(user));
};

const updateProfilePhoto = async (userId, file) => {
  const existing = await userRepository.findById(userId);
  if (!existing) throw new NotFoundError("user");

  const key = file.filename;
  const buffer = await fsp.readFile(file.path);
  await uploadObject(env.supabase.bucketProfile, key, buffer, file.mimetype);

  const oldKey = existing.profilePhoto;

  let updated;
  try {
    updated = await userRepository.update(userId, { profilePhoto: key });
  } catch (err) {
    await removeObject(env.supabase.bucketProfile, key).catch(() => {});
    throw err;
  }

  if (oldKey && oldKey !== key) {
    await removeObject(env.supabase.bucketProfile, oldKey).catch((err) =>
      logger.warn(`failed to remove old profile object ${oldKey}: ${err.message}`),
    );
  }

  return await signProfilePhoto(stripPassword(updated));
};

const updatePassword = async (userId, oldPassword, newPassword) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError("user");

  const isValid = await bcrypt.compare(oldPassword, user.password);
  if (!isValid) throw new BadRequestError("password lama salah");

  const hashed = await bcrypt.hash(newPassword, 10);
  await userRepository.update(userId, {
    password: hashed,
  });
  await userRepository.deleteAllRefreshTokens(userId);
};

const issueResetToken = async (user) => {
  const token = crypto.randomBytes(32).toString("hex");
  const ttlSec = parseInt(process.env.RESET_PASSWORD_TOKEN_EXPIRES, 10) || 3600;
  const expiresAt = new Date(Date.now() + ttlSec * 1000);
  await userRepository.createPasswordReset(user.id, token, expiresAt);
  return {
    token,
    expiresAt,
  };
};

const requestPasswordReset = async (email) => {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.isActive) return null;

  const { token, expiresAt } = await issueResetToken(user);
  return {
    token,
    expiresAt,
    email: user.email,
  };
};

const resetPasswordWithToken = async (token, newPassword) => {
  const reset = await userRepository.findValidResetByToken(token);
  if (!reset) throw new InvalidResetTokenError();

  const hashed = await bcrypt.hash(newPassword, 10);
  await userRepository.consumePasswordReset(reset.user.id, hashed, reset.id);
};

const adminInitiatePasswordReset = async (targetUserId) => {
  const user = await userRepository.findById(targetUserId);
  if (!user) throw new NotFoundError("user");

  const { token, expiresAt } = await issueResetToken(user);
  return {
    employeeId: user.employeeId,
    email: user.email,
    token,
    expiresAt,
  };
};

const getAllUsers = async ({
  page = 1,
  limit = 10,
  search,
  departmentId,
  role,
  isActive,
}) => {
  const skip = (page - 1) * limit;
  const { data, total } = await userRepository.findAll({
    skip,
    take: limit,
    search,
    departmentId,
    role,
    isActive,
  });

  const signedData = await Promise.all(data.map(signProfilePhoto));

  return {
    data: signedData,
    pagination: paginationMeta({ total, page, limit }),
  };
};

const getUserById = async (userId) => {
  const user = await userRepository.findDetailById(userId);
  if (!user) throw new NotFoundError("user");
  return await signProfilePhoto(user);
};

const toggleActiveUser = async (userId, actorId) => {
  if (userId === actorId) {
    throw new BadRequestError("tidak bisa menonaktifkan akun sendiri");
  }

  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError("user");

  return await userRepository.update(userId, { isActive: !user.isActive });
};

const adminUpdateUser = async (userId, payload, actorId) => {
  const existing = await userRepository.findById(userId);
  if (!existing) throw new NotFoundError("user");

  if (
    userId === actorId &&
    (payload.isActive === false || (payload.role && payload.role !== "ADMIN"))
  ) {
    throw new BadRequestError(
      "tidak bisa menonaktifkan atau menurunkan role akun sendiri",
    );
  }

  const { departmentCode, password, email, ...rest } = payload;
  const data = { ...rest };

  if (email && email !== existing.email) {
    const other = await userRepository.findByEmail(email);
    if (other && other.id !== userId) throw new EmailAlreadyExistsError();
    data.email = email;
  }

  if (departmentCode) {
    const department = await userRepository.findDepartmentByCode(departmentCode);
    if (!department) throw new DepartmentNotFoundError(departmentCode);
    data.departmentId = department.id;
  }

  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  try {
    await userRepository.update(userId, data);
  } catch (err) {
    if (isUniqueViolation(err, ["email"])) throw new EmailAlreadyExistsError();
    throw err;
  }

  if (password) await userRepository.deleteAllRefreshTokens(userId);

  return await userRepository.findDetailById(userId);
};

export default {
  registerAdmin,
  createUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getProfile,
  updateProfile,
  updateProfilePhoto,
  updatePassword,
  requestPasswordReset,
  resetPasswordWithToken,
  adminInitiatePasswordReset,
  getAllUsers,
  getUserById,
  toggleActiveUser,
  adminUpdateUser,
};
