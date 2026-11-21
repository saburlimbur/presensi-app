import prisma from "../../lib/prisma.js";
import { isUniqueViolation } from "../../utils/error.js";
import { EmailAlreadyExistsError } from "./errors/user.error.js";

const departmentSelect = {
  id: true,
  name: true,
  code: true,
};

const create = async (data) => {
  try {
    return await prisma.user.create({ data });
  } catch (err) {
    if (isUniqueViolation(err, ["email"])) {
      throw new EmailAlreadyExistsError();
    }
    throw err;
  }
};

const countByRole = async (role) => {
  return await prisma.user.count({
    where: {
      role,
    },
  });
};

const findAll = async ({
  skip,
  take,
  search,
  departmentId,
  role,
  isActive,
}) => {
  const where = {
    ...(isActive !== undefined && {
      isActive,
    }),
    ...(role && {
      role,
    }),
    ...(departmentId && {
      departmentId,
    }),
    ...(search && {
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
    }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        profilePhoto: true,
        employeeId: true,
        position: true,
        role: true,
        isActive: true,
        isFaceRegistered: true,
        joinDate: true,
        department: {
          select: departmentSelect,
        },
        createdAt: true,
      },
    }),
    prisma.user.count({
      where,
    }),
  ]);

  return {
    data,
    total,
  };
};

const findById = async (id) => {
  return await prisma.user.findUnique({
    where: {
      id,
    },
  });
};

const findByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: {
      email,
    },
  });
};

const findProfileById = async (id) => {
  return await prisma.user.findUniqueOrThrow({
    where: {
      id,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      employeeId: true,
      position: true,
      role: true,
      joinDate: true,
      isActive: true,
      isFaceRegistered: true,
      profilePhoto: true,
      department: {
        select: departmentSelect,
      },
      faceEmbeddings: {
        select: {
          id: true,
          imageUrl: true,
          createdAt: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });
};

const findDetailById = async (id) => {
  return await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      employeeId: true,
      position: true,
      role: true,
      joinDate: true,
      isActive: true,
      isFaceRegistered: true,
      profilePhoto: true,
      department: {
        select: departmentSelect,
      },
      createdAt: true,
      updatedAt: true,
    },
  });
};

const isEmailExist = async (email) => {
  return await prisma.user.count({
    where: {
      email: email,
    },
  });
};

const findDepartmentByCode = async (code) => {
  return await prisma.department.findUnique({
    where: { code },
    select: { id: true, name: true, code: true },
  });
};

const findLastEmployeeId = async () => {
  const rows = await prisma.$queryRaw`
    SELECT "employeeId" FROM users
    WHERE "employeeId" ~ '^EMP-[0-9]+$'
    ORDER BY CAST(SUBSTRING("employeeId" FROM 5) AS INTEGER) DESC
    LIMIT 1
  `;
  return rows[0]?.employeeId ?? null;
};

const update = async (id, data) => {
  return await prisma.user.update({
    where: {
      id,
    },
    data,
  });
};

const createRefreshToken = async (userId, token, expiresAt) => {
  return await prisma.userRefreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
};

const findRefreshToken = async (token) => {
  return await prisma.userRefreshToken.findUnique({
    where: {
      token,
    },
    include: {
      user: true,
    },
  });
};

const deleteRefreshToken = async (token) => {
  return await prisma.userRefreshToken.deleteMany({
    where: {
      token,
    },
  });
};

const deleteAllRefreshTokens = async (userId) => {
  return await prisma.userRefreshToken.deleteMany({
    where: {
      userId,
    },
  });
};

const findValidResetByToken = async (token) => {
  return await prisma.userPasswordReset.findFirst({
    where: {
      token,
      usedAt: null,
      expiresAt: {
        gt: new Date()
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });
};

const createPasswordReset = async (userId, token, expiresAt) => {
  const [, created] = await prisma.$transaction([
    prisma.userPasswordReset.deleteMany({
      where: {
        userId,
        usedAt: null
      },
    }),
    prisma.userPasswordReset.create({
      data: {
        userId,
        token,
        expiresAt
      },
    }),
  ]);
  return created;
};

const consumePasswordReset = async (userId, hashedPassword, resetId) => {
  return await prisma.$transaction([
    prisma.user.update({
      where: {
        id: userId
      },
      data: {
        password: hashedPassword
      },
    }),
    prisma.userPasswordReset.update({
      where: {
        id: resetId
      },
      data: {
        usedAt: new Date()
      },
    }),
    prisma.userRefreshToken.deleteMany({
      where: {
        userId
      },
    }),
  ]);
};

export default {
  create,
  countByRole,
  findAll,
  findById,
  findByEmail,
  findProfileById,
  findDetailById,
  isEmailExist,
  findDepartmentByCode,
  findLastEmployeeId,
  update,
  createRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteAllRefreshTokens,
  findValidResetByToken,
  createPasswordReset,
  consumePasswordReset,
};
