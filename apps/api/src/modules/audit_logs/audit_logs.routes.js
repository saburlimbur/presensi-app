import express from "express";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import { adminMiddleware } from "../../middleware/admin.middleware.js";
import auditLogsController from "./audit_logs.controller.js";

const auditLogsRoutes = express.Router();

auditLogsRoutes.get(
  "/audit-logs",
  authMiddleware,
  adminMiddleware,
  auditLogsController.list,
);

export default auditLogsRoutes;
