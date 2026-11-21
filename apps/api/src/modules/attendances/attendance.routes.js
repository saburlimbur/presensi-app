import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { adminMiddleware } from "../../middleware/admin.middleware.js";
import attendanceController from "./attendance.controller.js";

const attendanceRoutes = express.Router();

attendanceRoutes.get(
  "/attendance/today",
  authMiddleware,
  attendanceController.getToday,
);

attendanceRoutes.get(
  "/attendance/my/history",
  authMiddleware,
  attendanceController.getMyHistory,
);

attendanceRoutes.get(
  "/attendance/locations",
  authMiddleware,
  attendanceController.listActiveLocations,
);

attendanceRoutes.post(
  "/attendance/check-in",
  authMiddleware,
  attendanceController.checkIn,
);

attendanceRoutes.post(
  "/attendance/check-out",
  authMiddleware,
  attendanceController.checkOut,
);

attendanceRoutes.get(
  "/attendance/user-summary-attendances",
  authMiddleware,
  adminMiddleware,
  attendanceController.adminSummary,
);

attendanceRoutes.get(
  "/attendance/list-user-attendances",
  authMiddleware,
  adminMiddleware,
  attendanceController.adminList,
);

attendanceRoutes.get(
  "/attendance/list-user-attendances/export",
  authMiddleware,
  adminMiddleware,
  attendanceController.adminExport,
);

attendanceRoutes.get(
  "/attendance/user-attendance/:id",
  authMiddleware,
  adminMiddleware,
  attendanceController.adminDetail,
);

attendanceRoutes.post(
  "/attendance/create-manual",
  authMiddleware,
  adminMiddleware,
  attendanceController.adminCreateManual,
);

export default attendanceRoutes;
