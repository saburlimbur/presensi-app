import notificationRepository from "./notification.repository.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import bus, { EVENTS } from "../../lib/events.js";
import { NotFoundError } from "../../utils/error.js";
import logger from "../../utils/logger.js";

const notifyUser = async ({ userId, type, title, body, data, event }) => {
  try {
    const row = await notificationRepository.create({
      userId,
      type,
      title,
      body,
      data: data ?? null,
    });
    bus.emit(event ?? EVENTS.PERMISSION_DECIDED, {
      ...row,
      userId,
    });
    return row;
  } catch (err) {
    logger.error(`notifyUser failed: ${err.message}`);
    return null;
  }
};

const notifyAllAdmins = async ({ type, title, body, data, event }) => {
  try {
    const adminIds = await notificationRepository.findActiveAdminIds();
    if (adminIds.length === 0)
      return {
        count: 0,
      };

    const now = new Date();
    const rows = adminIds.map((id) => ({
      userId: id,
      type,
      title,
      body,
      data: data ?? null,
      createdAt: now,
    }));

    const result = await notificationRepository.createMany(rows);
    bus.emit(event, {
      type,
      title,
      body,
      data: data ?? null,
      createdAt: now,
    });
    return result;
  } catch (err) {
    logger.error(`notifyAllAdmins failed: ${err.message}`);
    return null;
  }
};

const listForUser = async (userId, query) => {
  const { page = 1, limit = 20, unreadOnly = false, type } = query;
  const paging = getPagination(page, limit);

  const { data, total } = await notificationRepository.findByUser({
    userId,
    skip: paging.skip,
    take: paging.take,
    unreadOnly,
    type,
  });

  return {
    data,
    pagination: paginationMeta({ total, ...paging }),
  };
};

const unreadCount = async (userId) => {
  const count = await notificationRepository.countUnread(userId);
  return { unread: count };
};

const markAsRead = async (id, userId) => {
  const existing = await notificationRepository.findByIdForUser(id, userId);
  if (!existing) {
    throw new NotFoundError("notifikasi");
  }
  if (existing.readAt) return existing;
  return await notificationRepository.markRead(id);
};

const markAllAsRead = async (userId) => {
  const result = await notificationRepository.markAllRead(userId);
  return { updated: result.count };
};

export default {
  notifyUser,
  notifyAllAdmins,
  listForUser,
  unreadCount,
  markAsRead,
  markAllAsRead,
};
