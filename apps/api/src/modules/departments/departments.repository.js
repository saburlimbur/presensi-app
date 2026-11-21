import prisma from "../../lib/prisma.js";

const create = async (data) => {
  return await prisma.department.create({
    data,
  });
};

const findById = async (id) => {
  return await prisma.department.findUnique({
    where: {
      id,
    },
    include: {
      head: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
};

const findByCode = async (code, excludeId) => {
  return await prisma.department.findFirst({
    where: {
      code,
      ...(excludeId
        ? {
            id: {
              not: excludeId,
            },
          }
        : {}),
    },
    include: {
      employees: {
        select: {
          id: true,
          fullName: true,
          email: true,
          position: true,
          isActive: true,
        },
      },
    },
  });
};

const findAll = async ({ skip, take, search, code, name }) => {
  const where = {
    ...(name && {
      name: {
        contains: name,
        mode: "insensitive",
      },
    }),
    ...(code && {
      code: {
        contains: code,
        mode: "insensitive",
      },
    }),

    ...(search && {
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          code: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.department.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        head: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        employees: {
          select: {
            id: true,
            fullName: true,
            email: true,
            position: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    }),
    prisma.department.count({
      where,
    }),
  ]);

  return {
    data,
    total,
  };
};

const update = async (id, data) => {
  return await prisma.department.update({
    where: {
      id,
    },
    data,
  });
};

const deleteById = async (id) => {
  return await prisma.department.delete({
    where: {
      id,
    },
  });
};

export default {
  create,
  findById,
  findByCode,
  findAll,
  update,
  deleteById,
};
