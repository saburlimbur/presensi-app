import jwt from "jsonwebtoken";
import userRepository from "../modules/users/user.repository.js";
import logger from "../utils/logger.js";

const reject = (res, status, message) =>
  res.status(status).json({ success: false, message });

const createAuthMiddleware = (getToken) => async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) {
      return reject(res, 401, "akses ditolak. token tidak ditemukan.");
    }

    const { userId, purpose } = jwt.verify(token, process.env.JWT_SECRET);
    if (!userId || purpose) {
      return reject(res, 401, "payload token tidak valid.");
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return reject(res, 401, "user untuk token ini tidak ditemukan.");
    }
    if (!user.isActive) return reject(res, 403, "akun tidak aktif.");

    req.user = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      departmentId: user.departmentId,
    };

    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return reject(res, 401, "sesi sudah berakhir atau token tidak valid.");
    }

    logger.error(`auth middleware error: ${error.message}`);
    return reject(res, 500, "terjadi kesalahan internal pada server.");
  }
};

const bearerToken = (req) => {
  const authorization = req.headers.authorization;
  return authorization?.startsWith("Bearer ")
    ? authorization.split(" ")[1]
    : null;
};

export const authMiddleware = createAuthMiddleware(bearerToken);

export const sseAuthMiddleware = createAuthMiddleware(
  (req) => bearerToken(req) ?? req.query.token,
);
