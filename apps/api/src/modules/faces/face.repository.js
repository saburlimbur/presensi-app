import prisma from "../../lib/prisma.js";

const findByUserId = async (userId) => {
  return await prisma.faceEmbedding.findMany({
    where: {
      userId
    },
    select: {
      id: true,
      embedding: true,
      imageUrl: true,
      createdAt: true,
    },
  });
};

const findAll = async () => {
  return await prisma.faceEmbedding.findMany({
    select: {
      id: true,
      userId: true,
      embedding: true,
    },
  });
};

const countByUserId = async (userId) => {
  return await prisma.faceEmbedding.count({
    where: {
      userId,
    },
  });
};

export default {
  findByUserId,
  findAll,
  countByUserId,
};
