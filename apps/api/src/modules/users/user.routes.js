import express from "express";

import userController from "./user.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { adminMiddleware } from "../../middleware/admin.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";
import { authLimiter } from "../../middleware/rateLimit.middleware.js";

const userRoutes = express.Router();

userRoutes.post(
  "/users/register-admin",
  authLimiter,
  userController.registerAdmin,
);

userRoutes.post("/users/login", authLimiter, userController.loginUser);

userRoutes.post("/users/refresh-token", userController.refreshToken);

userRoutes.get("/users/profile", authMiddleware, userController.getProfile);

userRoutes.patch(
  "/users/profile",
  authMiddleware,
  userController.updateProfile,
);

userRoutes.patch(
  "/users/profile/photo",
  authMiddleware,
  upload.single("profile_photo"),
  userController.updateProfilePhoto,
);

userRoutes.patch(
  "/users/password",
  authMiddleware,
  userController.updatePassword,
);

userRoutes.post(
  "/users/password/forgot",
  authLimiter,
  userController.forgotPassword,
);
userRoutes.post(
  "/users/password/reset",
  authLimiter,
  userController.resetPassword,
);

userRoutes.post("/users/logout", authMiddleware, userController.logoutUser);

userRoutes.post(
  "/users",
  authMiddleware,
  adminMiddleware,
  userController.createUser,
);

userRoutes.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  userController.getAllUsers,
);

userRoutes.get(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  userController.getUserById,
);

userRoutes.patch(
  "/users/:id/toggle-active",
  authMiddleware,
  adminMiddleware,
  userController.toggleActiveUser,
);

userRoutes.patch(
  "/users/:id/reset-password",
  authMiddleware,
  adminMiddleware,
  userController.adminResetPassword,
);

userRoutes.patch(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  userController.updateUser,
);

export default userRoutes;
