import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { adminMiddleware } from "../../middleware/admin.middleware.js";
import { upload } from "../../middleware/upload.middleware.js";
import permissionController from "./permission.controller.js";

const permissionRoutes = express.Router();

permissionRoutes.post(
  "/permissions/request",
  authMiddleware,
  upload.single("permission_attachment"),
  permissionController.createUserPermission,
);

permissionRoutes.get(
  "/permissions/my-permission",
  authMiddleware,
  permissionController.getMyPermission,
);

permissionRoutes.get(
  "/permissions",
  authMiddleware,
  adminMiddleware,
  permissionController.getAllUserPermissions,
);

permissionRoutes.get(
  "/permissions/:id",
  authMiddleware,
  adminMiddleware,
  permissionController.getPermissionDetail,
);

permissionRoutes.patch(
  "/permissions/:id/approve",
  authMiddleware,
  adminMiddleware,
  permissionController.approvePermission,
);

permissionRoutes.patch(
  "/permissions/:id/reject",
  authMiddleware,
  adminMiddleware,
  permissionController.rejectPermission,
);

permissionRoutes.patch(
  "/permissions/:id/cancel",
  authMiddleware,
  permissionController.cancelPermission,
);

export default permissionRoutes;
