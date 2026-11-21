import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { adminMiddleware } from "../../middleware/admin.middleware.js";
import reportsController from "./reports.controller.js";

const reportsRoutes = express.Router();

reportsRoutes.get(
  "/reports/attendance/monthly",
  authMiddleware,
  adminMiddleware,
  reportsController.getMonthlyAttendanceReport,
);

reportsRoutes.get(
  "/reports/attendance/weekly",
  authMiddleware,
  adminMiddleware,
  reportsController.getWeeklyAttendanceReport,
);

reportsRoutes.get(
  "/reports/attendance/range",
  authMiddleware,
  adminMiddleware,
  reportsController.getRangeAttendanceReport,
);

export default reportsRoutes;
