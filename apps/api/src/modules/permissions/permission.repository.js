import prisma from "../../lib/prisma.js";
import { toUtcDayStart, toUtcNextDayStart } from "../../utils/date.js";

const userAndApprover = {
  user: {
    select: {
      id: true,
      fullName: true,
      employeeId: true,
      department: true,
      position: true,
    },
  },
  approver: {
    select: {
      id: true,
      fullName: true,
    },
  },
};

const findActiveApprovedForUserOnDate = async (userId, date) => {
  const startOfDay = toUtcDayStart(date);
  const endOfDay = toUtcNextDayStart(date);

  return await prisma.permission.findFirst({
    where: {
      userId,
      status: "APPROVED",
      startDate: {
        lt: endOfDay,
      },
      endDate: {
        gte: startOfDay,
      },
    },
    orderBy: { startDate: "desc" },
  });
};

const createPermission = async (data) => {
  return await prisma.permission.create({
    data: {
      userId: data.userId,
      startDate: toUtcDayStart(data.startDate),
      endDate: toUtcDayStart(data.endDate),
      duration: data.duration,
      type: data.type,
      reason: data.reason ?? null,
      attachmentUrl: data.attachmentUrl ?? null,
    },
  });
};

const findManyByUserId = async (userId) => {
  return await prisma.permission.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      duration: true,
      type: true,
      reason: true,
      status: true,
      attachmentUrl: true,
      approvedBy: true,
      approvedNote: true,
      approvedAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const findAllPermissions = async ({
  skip,
  take,
  search,
  type,
  status,
  userId,
  startDate,
  endDate,
}) => {
  const where = {
    ...(type && { type }),
    ...(status && { status }),
    ...(userId && { userId }),

    ...((startDate || endDate) && {
      AND: [
        startDate
          ? {
              endDate: {
                gte: new Date(startDate),
              },
            }
          : {},
        endDate
          ? {
              startDate: {
                lte: new Date(endDate),
              },
            }
          : {},
      ],
    }),

    ...(search && {
      OR: [
        {
          reason: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          user: {
            fullName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            employeeId: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ],
    }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.permission.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
      include: userAndApprover,
    }),
    prisma.permission.count({
      where,
    }),
  ]);

  return { data, total };
};

const findById = async (id) => {
  return await prisma.permission.findUnique({
    where: {
      id
    },
    include: userAndApprover,
  });
};

const updateStatusIfPending = async (id, data, client = prisma) => {
  const result = await client.permission.updateMany({
    where: { id, status: "PENDING" },
    data: {
      status: data.status,
      approvedBy: data.approvedBy,
      approvedNote: data.approvedNote ?? null,
      approvedAt: data.approvedAt,
    },
  });
  if (result.count === 0) return null;

  return await client.permission.findUnique({
    where: {
      id
    },
    include: userAndApprover,
  });
};

const cancelOwnPendingPermission = async (id, userId) => {
  const result = await prisma.permission.updateMany({
    where: { id, userId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
  if (result.count === 0) return null;

  return await prisma.permission.findUnique({
    where: {
      id
    },
    include: userAndApprover,
  });
};

export default {
  findActiveApprovedForUserOnDate,
  createPermission,
  findManyByUserId,
  findAllPermissions,
  findById,
  updateStatusIfPending,
  cancelOwnPendingPermission,
};
