import prisma from "../../lib/prisma.js";

const createMany = async (rows) => {
  if (!rows || rows.length === 0) return { count: 0 };
  return await prisma.notification.createMany({ data: rows });
};

const create = async (data) => {
  return await prisma.notification.create({ data });
};

const findByUser = async ({ userId, skip, take, unreadOnly, type }) => {
  const where = {
    userId,
    ...(unreadOnly && {
      readAt: null,
    }),
    ...(type && {
      type,
    }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.notification.count({
      where,
    }),
  ]);

  return { data, total };
};

const countUnread = async (userId) => {
  return await prisma.notification.count({
    where: {
      userId,
      readAt: null
    },
  });
};

const findByIdForUser = async (id, userId) => {
  return await prisma.notification.findFirst({
    where: {
      id,
      userId,
    },
  });
};

const markRead = async (id) => {
  return await prisma.notification.update({
    where: {
      id,
    },
    data: {
      readAt: new Date(),
    },
  });
};

const markAllRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
};

const findActiveAdminIds = async () => {
  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      isActive: true,
    },
    select: {
      id: true,
    },
  });
  return admins.map((a) => a.id);
};

export default {
  create,
  createMany,
  findByUser,
  countUnread,
  findByIdForUser,
  markRead,
  markAllRead,
  findActiveAdminIds,
};
