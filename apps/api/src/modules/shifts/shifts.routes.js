import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { adminMiddleware } from "../../middleware/admin.middleware.js";
import shiftsController from "./shifts.controller.js";

const shiftsRoutes = express.Router();

shiftsRoutes.get(
  "/shifts",
  authMiddleware,
  adminMiddleware,
  shiftsController.getAllShifts,
);

shiftsRoutes.get(
  "/shifts/active",
  authMiddleware,
  shiftsController.getActiveShift,
);

shiftsRoutes.get(
  "/shifts/:id",
  authMiddleware,
  adminMiddleware,
  shiftsController.getShiftById,
);

shiftsRoutes.post(
  "/shifts",
  authMiddleware,
  adminMiddleware,
  shiftsController.createShift,
);

shiftsRoutes.put(
  "/shifts/:id",
  authMiddleware,
  adminMiddleware,
  shiftsController.updateShift,
);

shiftsRoutes.delete(
  "/shifts/:id",
  authMiddleware,
  adminMiddleware,
  shiftsController.deleteShift,
);

export default shiftsRoutes;
