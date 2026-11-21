import prisma from "../../lib/prisma.js";
import { isUniqueViolation, NotFoundError } from "../../utils/error.js";
import { LeaveBalanceAlreadyExistsError } from "./errors/leave-balance.error.js";

const userWithDepartment = {
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      employeeId: true,
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  },
};

const create = async (data) => {
  try {
    return await prisma.leaveBalance.create({
      data,
    });
  } catch (err) {
    if (isUniqueViolation(err, ["userId", "year"])) {
      throw new LeaveBalanceAlreadyExistsError(data.userId, data.year);
    }
    if (err?.code === "P2003") throw new NotFoundError("user");
    throw err;
  }
};

const findByUserAndYear = async (userId, year) => {
  return await prisma.leaveBalance.findUnique({
    where: {
      userId_year: {
        userId,
        year,
      },
    },
    include: userWithDepartment,
  });
};

const findById = async (id) => {
  return await prisma.leaveBalance.findUnique({
    where: {
      id,
    },
    include: userWithDepartment,
  });
};

const findManyByUser = async (userId) => {
  return await prisma.leaveBalance.findMany({
    where: { userId },
    orderBy: { year: "desc" },
  });
};

const findAll = async ({ skip, take, search, userId, year }) => {
  const where = {
    ...(userId && {
      userId,
    }),
    ...(year && {
      year,
    }),
    ...(search && {
      user: {
        OR: [
          {
            fullName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            employeeId: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      },
    }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.leaveBalance.findMany({
      where,
      skip,
      take,
      orderBy: [
        {
          year: "desc",
        },
        {
          updatedAt: "desc",
        },
      ],
      include: userWithDepartment,
    }),
    prisma.leaveBalance.count({ where }),
  ]);

  return { data, total };
};

const update = async (id, data) => {
  return await prisma.leaveBalance.update({
    where: {
      id,
    },
    data,
    include: userWithDepartment,
  });
};

const deductDays = async (userId, year, days, client = prisma) => {
  const result = await client.leaveBalance.updateMany({
    where: {
      userId,
      year,
      remainingDays: {
        gte: days,
      },
    },
    data: {
      remainingDays: {
        decrement: days,
      },
      usedDays: {
        increment: days,
      },
    },
  });
  return result.count;
};

export default {
  create,
  findByUserAndYear,
  findById,
  findManyByUser,
  findAll,
  update,
  deductDays,
};
