import { validate } from "../../utils/validate.js";

import notificationService from "./notification.service.js";
import { listNotificationQuerySchema } from "./notification.model.js";
import {
  registerUserClient,
  registerAdminClient,
  removeClient,
} from "../../lib/sse.js";
import { sendError } from "../../utils/error.js";
import logger from "../../utils/logger.js";

const list = async (req, res) => {
  try {
    const value = validate(listNotificationQuerySchema, req.query);
    const result = await notificationService.listForUser(req.user.id, value);

    return res.status(200).json({
      success: true,
      message: "daftar notifikasi berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    logger.error(`list notifications error: ${err.message}`);
    return sendError(res, err);
  }
};

const unreadCount = async (req, res) => {
  try {
    const data = await notificationService.unreadCount(req.user.id);
    return res.status(200).json({
      success: true,
      message: "jumlah notifikasi belum dibaca berhasil diambil",
      data,
    });
  } catch (err) {
    logger.error(`unread count error: ${err.message}`);
    return sendError(res, err);
  }
};

const markRead = async (req, res) => {
  try {
    const data = await notificationService.markAsRead(
      req.params.id,
      req.user.id,
    );
    return res.status(200).json({
      success: true,
      message: "notifikasi ditandai sudah dibaca",
      data,
    });
  } catch (err) {
    logger.error(`mark read error: ${err.message}`);
    return sendError(res, err);
  }
};

const markAllRead = async (req, res) => {
  try {
    const data = await notificationService.markAllAsRead(req.user.id);
    return res.status(200).json({
      success: true,
      message: "semua notifikasi ditandai sudah dibaca",
      data,
    });
  } catch (err) {
    logger.error(`mark all read error: ${err.message}`);
    return sendError(res, err);
  }
};

const stream = (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();
  res.write(`retry: 5000\n\n`);
  res.write(`event: connected\ndata: ${JSON.stringify({ userId, role })}\n\n`);

  if (role === "ADMIN") {
    registerAdminClient(res);
  } else {
    registerUserClient(userId, res);
  }

  req.on("close", () => {
    removeClient(userId, res);
    logger.info(`SSE disconnect: user=${userId} role=${role}`);
  });
};

export default {
  list,
  unreadCount,
  markRead,
  markAllRead,
  stream,
};
