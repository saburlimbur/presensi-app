import {
  calculateDistance,
  effectiveTolerance,
} from "../../utils/geolocation.js";
import {
  buildAttendanceWorkbook,
  buildExportFilename,
} from "../../utils/attendance-export.js";
import {
  toUtcDayStart,
  minutesOfDayJakarta,
  minutesOfDayFromDbTime,
  formatJakartaDate,
} from "../../utils/date.js";
import attendanceRepository from "./attendance.repository.js";
import { paginationMeta } from "../../utils/pagination.js";
import shiftsRepository from "../shifts/shifts.repository.js";
import permissionRepository from "../permissions/permission.repository.js";
import { signAttachment } from "../permissions/helpers/sign-attachment.js";
import {
  isHalfDayPermission,
  isLeaveLikePermission,
  isWfhPermission,
  mapPermissionTypeToAttendanceStatus,
} from "./helpers/permission-mapping.js";
import {
  AlreadyCheckedInError,
  AlreadyCheckedOutError,
  NotCheckedInError,
  CheckOutWindowExpiredError,
} from "./errors/attendance.error.js";
import { env } from "../../config/env.js";
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from "../../utils/error.js";
import notificationService from "../notifications/notification.service.js";
import { EVENTS } from "../../lib/events.js";

const MAX_EXPORT_RANGE_DAYS = 92;

// Sesi terbuka yang umurnya lewat batas tidak boleh di-check-out sendiri
// (durasi kerja jadi tidak masuk akal) — harus dikoreksi admin.
const isSessionExpired = (session, now) =>
  now.getTime() - new Date(session.checkIn).getTime() >
  env.attendance.maxOpenSessionHours * 60 * 60 * 1000;

const resolveWfoLocation = async (latitude, longitude, accuracy) => {
  const locations = await attendanceRepository.findActiveLocations();
  if (locations.length === 0) {
    throw new BadRequestError("belum ada lokasi kantor yang dikonfigurasi.");
  }

  const tolerance = effectiveTolerance(accuracy);
  let nearest = null;

  for (const loc of locations) {
    const distance = calculateDistance(
      latitude,
      longitude,
      loc.latitude,
      loc.longitude,
    );
    if (!nearest || distance < nearest.distance) {
      nearest = { location: loc, distance };
    }
    if (distance <= loc.radius + tolerance) {
      return { location: loc, distance };
    }
  }

  const detail = nearest
    ? ` lokasi terdekat "${nearest.location.name}" berjarak ${nearest.distance}m (radius ${nearest.location.radius}m).`
    : "";
  throw new BadRequestError(
    `anda berada di luar radius lokasi kantor yang terdaftar.${detail}`,
  );
};

const computeLateStatus = (shift, now) => {
  if (!shift) return "PRESENT";
  const currentMinutes = minutesOfDayJakarta(now);
  const shiftMinutes = minutesOfDayFromDbTime(shift.startTime);
  const diff = currentMinutes - shiftMinutes;
  return diff > shift.gracePeriod ? "LATE" : "PRESENT";
};

const checkIn = async (userId, body, ipAddress = null) => {
  const now = new Date();
  const todayDate = toUtcDayStart(now);

  const { exists } = await attendanceRepository.checkExistence(userId, now);
  if (exists) throw new AlreadyCheckedInError();

  const permission = await permissionRepository.findActiveApprovedForUserOnDate(
    userId,
    now,
  );

  if (permission && isLeaveLikePermission(permission.type)) {
    throw new ConflictError(
      `anda sedang dalam izin yang disetujui (${permission.type}). check-in tidak diizinkan.`,
    );
  }

  const activeShift = await shiftsRepository.findActiveShift();

  const effectiveWorkMode =
    permission && isWfhPermission(permission.type) ? "WFA" : body.workMode;

  let isLocationValid = null;
  let geoMeta = null;
  if (effectiveWorkMode === "WFO") {
    const { location, distance } = await resolveWfoLocation(
      body.latitude,
      body.longitude,
      body.gpsAccuracy,
    );
    isLocationValid = true;
    geoMeta = {
      locationId: location.id,
      locationName: location.name,
      distance,
    };
  }

  let status;
  if (permission && isWfhPermission(permission.type)) {
    status = "WORK_FROM_HOME";
  } else {
    status = computeLateStatus(activeShift, now);
  }

  const metadata = {
    ...(geoMeta && { checkInGeo: geoMeta }),
    ...(permission && isHalfDayPermission(permission.type) && { halfDay: true }),
  };

  const created = await attendanceRepository.create({
    userId,
    workMode: effectiveWorkMode,
    shiftName: activeShift?.name ?? null,
    date: todayDate,
    checkIn: now,
    status,
    permissionId: permission?.id ?? null,
    latitudeIn: body.latitude,
    longitudeIn: body.longitude,
    gpsAccuracyIn: body.gpsAccuracy ?? null,
    isLocationValid,
    method: "FACE_RECOGNITION",
    deviceInfo: body.deviceInfo,
    ipAddress,
    note: body.note,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  });

  notificationService.notifyAllAdmins({
    type: "ATTENDANCE_CHECK_IN",
    title: "Karyawan check-in",
    body: `Status: ${status}, mode: ${effectiveWorkMode}`,
    data: {
      attendanceId: created.id,
      userId,
      status,
      workMode: effectiveWorkMode,
      checkInAt: now.toISOString(),
    },
    event: EVENTS.ATTENDANCE_CHECKED_IN,
  });

  return created;
};

const checkOut = async (userId, body) => {
  const now = new Date();

  const existing = await attendanceRepository.findLatestOpenSession(userId);

  if (!existing) throw new NotCheckedInError();
  if (isSessionExpired(existing, now)) throw new CheckOutWindowExpiredError();

  let geoMeta = null;
  if (existing.workMode === "WFO") {
    const { location, distance } = await resolveWfoLocation(
      body.latitude,
      body.longitude,
      body.gpsAccuracy,
    );
    geoMeta = {
      locationId: location.id,
      locationName: location.name,
      distance,
    };
  }

  const mergedMetadata = geoMeta
    ? {
        ...(existing.metadata ?? {}),
        checkOutGeo: geoMeta,
      }
    : undefined;

  const updatedCount = await attendanceRepository.markCheckedOut(existing.id, {
    checkOut: now,
    latitudeOut: body.latitude,
    longitudeOut: body.longitude,
    gpsAccuracyOut: body.gpsAccuracy ?? null,
    ...(mergedMetadata !== undefined && { metadata: mergedMetadata }),
  });

  if (updatedCount === 0) throw new AlreadyCheckedOutError();

  const updated = await attendanceRepository.findByIdWithRelations(existing.id);

  notificationService.notifyAllAdmins({
    type: "ATTENDANCE_CHECK_OUT",
    title: "Karyawan check-out",
    body: `Mode: ${updated?.workMode ?? existing.workMode}`,
    data: {
      attendanceId: existing.id,
      userId,
      checkOutAt: now.toISOString(),
    },
    event: EVENTS.ATTENDANCE_CHECKED_OUT,
  });

  return updated;
};

const getToday = async (userId) => {
  const now = new Date();
  const todayDate = toUtcDayStart(now);

  const [attendance, activeShift, permission, prevOpen] = await Promise.all([
    attendanceRepository.findByUserAndDate(userId, now),
    shiftsRepository.findActiveShift(),
    permissionRepository.findActiveApprovedForUserOnDate(userId, now),
    attendanceRepository.findOpenBeforeToday(userId),
  ]);

  const prevExpired = prevOpen ? isSessionExpired(prevOpen, now) : false;

  let state;
  let displayAttendance = attendance;
  if (attendance) {
    state = attendance.checkOut ? "DONE" : "WORKING";
  } else if (prevOpen && !prevExpired) {
    state = "PENDING_CHECKOUT_PREV_DAY";
    displayAttendance = prevOpen;
  } else if (permission && isLeaveLikePermission(permission.type)) {
    state = "ON_LEAVE";
  } else if (permission && isWfhPermission(permission.type)) {
    state = "WFH_PENDING_CHECKIN";
  } else {
    state = "NOT_CHECKED_IN";
  }

  // Sesi hari sebelumnya yang masih terbuka tapi bukan sesi yang ditampilkan
  // (umumnya karena sudah expired). Tidak memblokir check-in hari ini — FE
  // cukup tampilkan peringatan, penyelesaiannya lewat koreksi admin.
  const unresolvedSession =
    prevOpen && displayAttendance !== prevOpen
      ? {
          id: prevOpen.id,
          date: formatJakartaDate(prevOpen.date),
          checkIn: prevOpen.checkIn,
          workMode: prevOpen.workMode,
          expired: prevExpired,
        }
      : null;

  return {
    state,
    today: formatJakartaDate(todayDate),
    attendance: displayAttendance,
    unresolvedSession,
    shift: activeShift
      ? {
          id: activeShift.id,
          name: activeShift.name,
          startTime: activeShift.startTime,
          endTime: activeShift.endTime,
          gracePeriod: activeShift.gracePeriod,
        }
      : null,
    activePermission: permission
      ? {
          id: permission.id,
          type: permission.type,
          status: permission.status,
          startDate: permission.startDate,
          endDate: permission.endDate,
          reason: permission.reason,
          attachmentUrl: permission.attachmentUrl,
          attachmentUrl_url: (await signAttachment(permission))
            .attachmentUrl_url,
        }
      : null,
  };
};

const getMyHistory = async (userId, filters) => {
  const { items, total } = await attendanceRepository.findMyHistory(
    userId,
    filters,
  );
  return {
    items,
    pagination: paginationMeta({
      total,
      page: filters.page,
      limit: filters.limit,
    }),
  };
};

const listActiveLocations = async () => {
  const locations = await attendanceRepository.findActiveLocations();
  return locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    address: loc.address,
    latitude: loc.latitude,
    longitude: loc.longitude,
    radius: loc.radius,
  }));
};

const listAdmin = async (filters) => {
  const { items, total } = await attendanceRepository.findManyAdmin(filters);
  return {
    items,
    pagination: paginationMeta({
      total,
      page: filters.page,
      limit: filters.limit,
    }),
  };
};

const getDetailAdmin = async (id) => {
  const attendance = await attendanceRepository.findByIdAdmin(id);
  if (!attendance) throw new NotFoundError("absensi");
  return attendance;
};

const getSummaryAdmin = async (date) => {
  const target = date ? new Date(date) : new Date();
  const { byStatus, byWorkMode, total } =
    await attendanceRepository.summaryByDate(target);

  const statusCounts = byStatus.reduce((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});
  const workModeCounts = byWorkMode.reduce((acc, row) => {
    acc[row.workMode] = row._count._all;
    return acc;
  }, {});

  return {
    date: formatJakartaDate(target),
    total,
    byStatus: {
      PRESENT: statusCounts.PRESENT ?? 0,
      LATE: statusCounts.LATE ?? 0,
      ABSENT: statusCounts.ABSENT ?? 0,
      SICK: statusCounts.SICK ?? 0,
      PERMIT: statusCounts.PERMIT ?? 0,
      ON_LEAVE: statusCounts.ON_LEAVE ?? 0,
      HOLIDAY: statusCounts.HOLIDAY ?? 0,
      WORK_FROM_HOME: statusCounts.WORK_FROM_HOME ?? 0,
    },
    byWorkMode: {
      WFO: workModeCounts.WFO ?? 0,
      WFA: workModeCounts.WFA ?? 0,
    },
  };
};

const exportAdmin = async (filters) => {
  if (filters.dateFrom && filters.dateTo) {
    const diffDays =
      (new Date(filters.dateTo) - new Date(filters.dateFrom)) /
      (1000 * 60 * 60 * 24);
    if (diffDays > MAX_EXPORT_RANGE_DAYS) {
      throw new BadRequestError(
        `rentang tanggal terlalu besar. maksimal ${MAX_EXPORT_RANGE_DAYS} hari.`,
      );
    }
  }

  const items = await attendanceRepository.findAllAdminForExport(filters);

  return {
    workbook: buildAttendanceWorkbook(items, filters),
    filename: buildExportFilename(filters),
    total: items.length,
  };
};

const createManualAdmin = async (adminId, body) => {
  const user = await attendanceRepository.findUserById(body.userId);
  if (!user) throw new NotFoundError("user target");
  if (!user.isActive) throw new BadRequestError("user target tidak aktif.");

  const { exists } = await attendanceRepository.checkExistence(
    body.userId,
    body.date,
  );
  if (exists) throw new AlreadyCheckedInError();

  return await attendanceRepository.create({
    userId: body.userId,
    date: toUtcDayStart(body.date),
    checkIn: new Date(body.checkIn),
    checkOut: body.checkOut ? new Date(body.checkOut) : null,
    status: body.status,
    workMode: body.workMode,
    shiftName: body.shiftName ?? null,
    method: "MANUAL",
    latitudeIn: body.latitudeIn ?? null,
    longitudeIn: body.longitudeIn ?? null,
    latitudeOut: body.latitudeOut ?? null,
    longitudeOut: body.longitudeOut ?? null,
    note: body.note ?? null,
    isLocationValid: null,
    metadata: {
      createdByAdmin: adminId,
      source: "ADMIN_MANUAL",
    },
  });
};

const materializeForApprovedPermission = async (permission, client) => {
  if (!isLeaveLikePermission(permission.type)) {
    return { created: 0, skipped: 0 };
  }

  const status = mapPermissionTypeToAttendanceStatus(permission.type);
  const start = toUtcDayStart(permission.startDate);
  const end = toUtcDayStart(permission.endDate);

  const dates = [];
  for (
    let cursor = new Date(start);
    cursor <= end;
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
  ) {
    dates.push(new Date(cursor));
  }
  if (dates.length === 0) return { created: 0, skipped: 0 };

  const result = await attendanceRepository.createManyForLeave(
    {
      userId: permission.userId,
      permissionId: permission.id,
      status,
      workMode: "WFA",
      method: "MANUAL",
      source: "PERMISSION_APPROVED",
      permissionType: permission.type,
      dates,
    },
    client,
  );

  return {
    created: result.count,
    skipped: dates.length - result.count,
  };
};

export default {
  checkIn,
  checkOut,
  getToday,
  getMyHistory,
  listActiveLocations,
  listAdmin,
  exportAdmin,
  getDetailAdmin,
  getSummaryAdmin,
  createManualAdmin,
  materializeForApprovedPermission,
};
