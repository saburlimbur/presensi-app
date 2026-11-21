import express from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { adminMiddleware } from "../../middleware/admin.middleware.js";
import locationsController from "./locations.controller.js";

const locationsRoutes = express.Router();

locationsRoutes.get(
  "/locations",
  authMiddleware,
  adminMiddleware,
  locationsController.getAllLocations,
);

locationsRoutes.get(
  "/locations/:id",
  authMiddleware,
  adminMiddleware,
  locationsController.getLocationById,
);

locationsRoutes.post(
  "/locations",
  authMiddleware,
  adminMiddleware,
  locationsController.createLocation,
);

locationsRoutes.put(
  "/locations/:id",
  authMiddleware,
  adminMiddleware,
  locationsController.updateLocation,
);

locationsRoutes.delete(
  "/locations/:id",
  authMiddleware,
  adminMiddleware,
  locationsController.deleteLocation,
);

export default locationsRoutes;
