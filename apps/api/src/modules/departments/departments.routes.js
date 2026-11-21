import express from "express";
import { adminMiddleware } from "../../middleware/admin.middleware.js";
import departmentsController from "./departments.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const departmentsRoutes = express.Router();

departmentsRoutes.get(
  "/departments",
  authMiddleware,
  adminMiddleware,
  departmentsController.getAllDepartments,
);

departmentsRoutes.get(
  "/departments/code/:code",
  authMiddleware,
  adminMiddleware,
  departmentsController.getDepartmentByCode,
);

departmentsRoutes.get(
  "/departments/:id",
  authMiddleware,
  adminMiddleware,
  departmentsController.getDepartmentById,
);

departmentsRoutes.post(
  "/departments",
  authMiddleware,
  adminMiddleware,
  departmentsController.createDepartment,
);

departmentsRoutes.put(
  "/departments/:id",
  authMiddleware,
  adminMiddleware,
  departmentsController.updateDepartment,
);

departmentsRoutes.delete(
  "/departments/:id",
  authMiddleware,
  adminMiddleware,
  departmentsController.deleteDepartment,
);

export default departmentsRoutes;
