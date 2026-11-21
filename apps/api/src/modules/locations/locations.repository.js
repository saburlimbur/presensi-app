import prisma from "../../lib/prisma.js";

const findAll = async ({ skip, take, search, isActive }) => {
  const where = {
    deletedAt: null,
    ...(typeof isActive === "boolean" && { isActive }),
    ...(search && {
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          address: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.attendanceLocation.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.attendanceLocation.count({
      where
    }),
  ]);

  return { data, total };
};

const findById = async (id) => {
  return await prisma.attendanceLocation.findFirst({
    where: {
      id,
      deletedAt: null,
    },
  });
};

const findByName = async (name, excludeId = null) => {
  return await prisma.attendanceLocation.findFirst({
    where: {
      name,
      deletedAt: null,
      ...(excludeId ? {
        NOT: {
          id: excludeId
        }
      } : {}),
    },
  });
};

const create = async (data) => {
  return await prisma.attendanceLocation.create({ data });
};

const update = async (id, data) => {
  return await prisma.attendanceLocation.update({
    where: {
      id
    },
    data,
  });
};

const softDelete = async (id) => {
  return await prisma.attendanceLocation.update({
    where: {
      id
    },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });
};

export default {
  findAll,
  findById,
  findByName,
  create,
  update,
  softDelete,
};
