import prisma from "../../lib/prisma.js";
import { toUtcNextDayStart } from "../../utils/date.js";

const create = async (data) => {
  return await prisma.auditLog.create({ data });
};

const buildWhere = ({ userId, action, dateFrom, dateTo }) => {
  const where = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lt = toUtcNextDayStart(dateTo);
  }
  return where;
};

const findMany = async ({ skip, take, userId, action, dateFrom, dateTo }) => {
  const where = buildWhere({ userId, action, dateFrom, dateTo });

  const [data, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: "desc"
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            employeeId: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({
      where
    }),
  ]);

  return { data, total };
};

export default {
  create,
  findMany,
};
