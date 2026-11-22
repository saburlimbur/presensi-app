import prisma from "../../lib/prisma.js";
import { toUtcDayStart, toUtcNextDayStart } from "../../utils/date.js";
import { isUniqueViolation } from "../../utils/error.js";
import { AlreadyCheckedInError } from "./errors/attendance.error.js";

const DEPARTMENT_SELECT = { id: true, name: true, code: true };

const LIST_USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  employeeId: true,
  position: true,
  department: { select: DEPARTMENT_SELECT },
};

const SESSION_USER_SELECT = { ...LIST_USER_SELECT, departmentId: true };

const DETAIL_USER_SELECT = { ...LIST_USER_SELECT, phone: true, role: true };

const PERMISSION_SELECT = {
  id: true,
  type: true,
  reason: true,
  status: true,
  startDate: true,
  endDate: true,
};

const create = async (data) => {
  try {
    return await prisma.attendance.create({ data });
  } catch (err) {
    if (isUniqueViolation(err, ["userId", "date"])) {
      throw new AlreadyCheckedInError();
    }
    throw err;
  }
};

const markCheckedOut = async (id, data) => {
  const result = await prisma.attendance.updateMany({
    where: {
      id,
      checkOut: null,
    },
    data,
  });
  return result.count;
};

const findByUserAndDate = async (userId, date) => {
  return await prisma.attendance.findUnique({
    where: {
      unique_user_date_attendance: {
        userId,
        date: toUtcDayStart(date),
      },
    },
    include: {
      user: { select: SESSION_USER_SELECT },
      permission: { select: PERMISSION_SELECT },
    },
  });
};

const checkExistence = async (userId, date) => {
  const record = await prisma.attendance.findUnique({
    where: {
      unique_user_date_attendance: {
        userId,
        date: toUtcDayStart(date),
      },
    },
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
    },
  });

  return {
    exists: !!record,
    record,
  };
};

const findActiveLocations = async () => {
  return await prisma.attendanceLocation.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
  });
};

const buildAdminWhere = (filters) => {
  const where = {};

  if (filters.date) {
    const start = toUtcDayStart(filters.date);
    const end = toUtcNextDayStart(filters.date);
    where.date = { gte: start, lt: end };
  } else if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) {
      where.date.gte = toUtcDayStart(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.date.lt = toUtcNextDayStart(filters.dateTo);
    }
  }

  if (filters.userId) where.userId = filters.userId;
  if (filters.status) where.status = filters.status;
  if (filters.workMode) where.workMode = filters.workMode;
  if (filters.shiftName) where.shiftName = filters.shiftName;

  if (filters.departmentId) {
    where.user = {
      departmentId: filters.departmentId,
    };
  }

  return where;
};

const findManyAdmin = async (filters) => {
  const where = buildAdminWhere(filters);
  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: [
        {
          date: "desc",
        },
        {
          checkIn: "desc",
        },
      ],
      include: {
        user: { select: LIST_USER_SELECT },
      },
    }),
    prisma.attendance.count({
      where
    }),
  ]);

  return { items, total };
};

const findAllAdminForExport = async (filters) => {
  const where = buildAdminWhere(filters);

  return await prisma.attendance.findMany({
    where,
    orderBy: [
      {
        date: "desc",
      },
      {
        checkIn: "desc",
      },
    ],
    include: {
      user: { select: LIST_USER_SELECT },
    },
  });
};

const findByIdAdmin = async (id) => {
  return await prisma.attendance.findUnique({
    where: {
      id,
    },
    include: {
      user: { select: DETAIL_USER_SELECT },
      permission: true,
    },
  });
};

const summaryByDate = async (date) => {
  const start = toUtcDayStart(date);
  const end = toUtcNextDayStart(date);

  const where = { date: { gte: start, lt: end } };

  const [byStatus, byWorkMode, total] = await Promise.all([
    prisma.attendance.groupBy({
      by: ["status"],
      where,
      _count: {
        _all: true,
      },
    }),
    prisma.attendance.groupBy({
      by: ["workMode"],
      where,
      _count: { _all: true },
    }),
    prisma.attendance.count({
      where,
    }),
  ]);

  return { byStatus, byWorkMode, total };
};

const findUserById = async (userId) => {
  return await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      fullName: true,
      isActive: true,
    },
  });
};

// Sesi terbuka = sudah check-in tapi belum check-out. `checkIn: { not: null }`
// wajib: record cuti (materialize dari izin) punya checkIn & checkOut null.
// Batas umur sesi (expired) diputuskan di service, bukan di query.
const findLatestOpenSession = async (userId) => {
  return await prisma.attendance.findFirst({
    where: {
      userId,
      checkOut: null,
      checkIn: { not: null },
    },
    orderBy: { checkIn: "desc" },
    include: {
      user: { select: SESSION_USER_SELECT },
      permission: { select: PERMISSION_SELECT },
    },
  });
};

const findOpenBeforeToday = async (userId) => {
  const todayStart = toUtcDayStart(new Date());
  return await prisma.attendance.findFirst({
    where: {
      userId,
      checkOut: null,
      date: {
        lt: todayStart
      },
      checkIn: {
        not: null
      },
    },
    orderBy: { checkIn: "desc" },
    include: {
      permission: { select: PERMISSION_SELECT },
    },
  });
};

const findByIdWithRelations = async (id) => {
  return await prisma.attendance.findUnique({
    where: {
      id
    },
    include: {
      user: { select: SESSION_USER_SELECT },
      permission: { select: PERMISSION_SELECT },
    },
  });
};

const createManyForLeave = async (
  {
    userId,
    permissionId,
    status,
    workMode,
    method,
    source,
    permissionType,
    dates,
  },
  client = prisma,
) => {
  if (!dates || dates.length === 0) return { count: 0 };

  const metadata = {
    source,
    permissionType,
  };

  const rows = dates.map((date) => ({
    userId,
    permissionId,
    date,
    status,
    workMode,
    method,
    metadata,
  }));

  return await client.attendance.createMany({
    data: rows,
    skipDuplicates: true,
  });
};

const findMyHistory = async (userId, filters) => {
  const where = { userId };

  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = toUtcDayStart(filters.dateFrom);
    if (filters.dateTo) where.date.lt = toUtcNextDayStart(filters.dateTo);
  }
  if (filters.status) where.status = filters.status;
  if (filters.workMode) where.workMode = filters.workMode;

  const skip = (filters.page - 1) * filters.limit;

  const [items, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: [
        {
          date: "desc",
        },
        {
          checkIn: "desc",
        },
      ],
      include: {
        permission: { select: PERMISSION_SELECT },
      },
    }),
    prisma.attendance.count({
      where,
    }),
  ]);

  return { items, total };
};

export default {
  create,
  markCheckedOut,
  findByUserAndDate,
  findLatestOpenSession,
  findOpenBeforeToday,
  findByIdWithRelations,
  checkExistence,
  findActiveLocations,
  findManyAdmin,
  findAllAdminForExport,
  findByIdAdmin,
  summaryByDate,
  findUserById,
  findMyHistory,
  createManyForLeave,
};
