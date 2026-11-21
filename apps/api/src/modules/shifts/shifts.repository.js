import prisma from "../../lib/prisma.js";

const findActiveShift = async () => {
  return await prisma.shift.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });
};

const findAll = async () => {
  return await prisma.shift.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

const findById = async (id) => {
  return await prisma.shift.findUnique({
    where: { id },
  });
};

const findByName = async (name, excludeId = null) => {
  return await prisma.shift.findFirst({
    where: {
      name,
      ...(excludeId
        ? {
            NOT: {
              id: excludeId,
            },
          }
        : {}),
    },
  });
};

const create = async (data) => {
  return await prisma.shift.create({
    data,
  });
};

const update = async (id, data) => {
  return await prisma.shift.update({
    where: { id },
    data,
  });
};

const updateAndSetActive = async (id, data) => {
  return await prisma.$transaction(async (tx) => {
    await tx.shift.updateMany({
      where: {
        isActive: true,
        NOT: {
          id
        },
      },
      data: {
        isActive: false
      },
    });
    return await tx.shift.update({
      where: {
        id
      },
      data: {
        ...data,
        isActive: true
      },
    });
  });
};

const destroy = async (id) => {
  return await prisma.shift.delete({
    where: {
      id
    },
  });
};

export default {
  findAll,
  findById,
  findByName,
  findActiveShift,
  create,
  update,
  updateAndSetActive,
  destroy,
};
