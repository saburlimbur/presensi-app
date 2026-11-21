import prisma from "../../lib/prisma.js";

const findAttendancesInRange = async ({ start, end, departmentId, userId }) => {
  const userWhere = {
    role: "EMPLOYEE",
    isActive: true,
    ...(departmentId && { departmentId }),
    ...(userId && { id: userId }),
  };

  return await prisma.user.findMany({
    where: userWhere,
    select: {
      id: true,
      fullName: true,
      employeeId: true,
      position: true,
      department: {
        select: {
          code: true,
          name: true
        }
      },
      attendances: {
        where: {
          date: {
            gte: start,
            lt: end
          }
        },
        select: {
          status: true,
          checkIn: true,
          checkOut: true,
          date: true
        },
      },
    },
    orderBy: [{
      department: {
        name: "asc"
      }
    }, {
        fullName: "asc"
      }],
  });
};

export default {
  findAttendancesInRange,
};
