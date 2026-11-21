import reportsRepository from "./reports.repository.js";
import {
  toUtcDayStart,
  toUtcNextDayStart,
  addDaysUtcStart,
} from "../../utils/date.js";
import { BadRequestError } from "../../utils/error.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 366;

const countWorkdaysInRange = (start, end) => {
  let count = 0;
  for (let t = start.getTime(); t < end.getTime(); t += MS_PER_DAY) {
    const dow = new Date(t).getUTCDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
};

const computeHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  return (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60);
};

const aggregateUser = (user) => {
  const counts = {
    present: 0,
    late: 0,
    absent: 0,
    permit: 0,
    leave: 0,
    wfh: 0,
  };
  let totalWorkHours = 0;

  user.attendances.forEach((a) => {
    switch (a.status) {
      case "PRESENT":
        counts.present++;
        break;
      case "LATE":
        counts.late++;
        break;
      case "ABSENT":
        counts.absent++;
        break;
      case "SICK":
      case "PERMIT":
        counts.permit++;
        break;
      case "ON_LEAVE":
        counts.leave++;
        break;
      case "WORK_FROM_HOME":
        counts.wfh++;
        break;
    }
    totalWorkHours += computeHours(a.checkIn, a.checkOut);
  });

  return {
    userId: user.id,
    employeeId: user.employeeId,
    fullName: user.fullName,
    position: user.position,
    department: user.department?.name ?? null,
    ...counts,
    totalWorkHours: Math.round(totalWorkHours * 100) / 100,
  };
};

const buildSummary = (details) =>
  details.reduce(
    (acc, u) => {
      acc.totalPresent += u.present;
      acc.totalLate += u.late;
      acc.totalAbsent += u.absent;
      acc.totalPermit += u.permit;
      acc.totalLeave += u.leave;
      acc.totalWfh += u.wfh;
      return acc;
    },
    {
      totalPresent: 0,
      totalLate: 0,
      totalAbsent: 0,
      totalPermit: 0,
      totalLeave: 0,
      totalWfh: 0,
    },
  );

const buildReport = async ({ start, end, departmentId, userId, period }) => {
  const users = await reportsRepository.findAttendancesInRange({
    start,
    end,
    departmentId,
    userId,
  });

  const details = users.map(aggregateUser);

  return {
    period: { ...period, workDays: countWorkdaysInRange(start, end) },
    summary: { totalEmployees: details.length, ...buildSummary(details) },
    details,
  };
};

const getMonthlyAttendanceReport = async ({
  month,
  year,
  departmentId,
  userId,
}) => {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  return buildReport({
    start,
    end,
    departmentId,
    userId,
    period: { month, year },
  });
};

const getWeeklyAttendanceReport = async ({
  weekStart,
  departmentId,
  userId,
}) => {
  const start = toUtcDayStart(weekStart);
  const end = addDaysUtcStart(start, 7);
  const weekEnd = addDaysUtcStart(start, 6);

  return buildReport({
    start,
    end,
    departmentId,
    userId,
    period: { weekStart: start, weekEnd },
  });
};

const getRangeAttendanceReport = async ({ from, to, departmentId, userId }) => {
  const start = toUtcDayStart(from);
  const end = toUtcNextDayStart(to);

  if (end - start > MAX_RANGE_DAYS * MS_PER_DAY) {
    throw new BadRequestError(`range maksimal ${MAX_RANGE_DAYS} hari`);
  }

  return buildReport({
    start,
    end,
    departmentId,
    userId,
    period: { from: start, to: toUtcDayStart(to) },
  });
};

export default {
  getMonthlyAttendanceReport,
  getWeeklyAttendanceReport,
  getRangeAttendanceReport,
};
