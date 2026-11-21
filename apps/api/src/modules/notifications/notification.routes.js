import express from "express";
import {
  authMiddleware,
  sseAuthMiddleware,
} from "../../middleware/auth.middleware.js";
import notificationController from "./notification.controller.js";

const notificationRoutes = express.Router();

notificationRoutes.get(
  "/events/stream",
  sseAuthMiddleware,
  notificationController.stream,
);

notificationRoutes.get(
  "/notifications",
  authMiddleware,
  notificationController.list,
);

notificationRoutes.get(
  "/notifications/unread-count",
  authMiddleware,
  notificationController.unreadCount,
);

notificationRoutes.patch(
  "/notifications/read-all",
  authMiddleware,
  notificationController.markAllRead,
);

notificationRoutes.patch(
  "/notifications/:id/read",
  authMiddleware,
  notificationController.markRead,
);

export default notificationRoutes;
