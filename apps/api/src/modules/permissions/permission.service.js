import {
  toUtcDayStart,
  formatJakartaDate,
  inJakarta,
} from "../../utils/date.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../utils/error.js";
import prisma from "../../lib/prisma.js";
import permissionRepository from "./permission.repository.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import notificationService from "../notifications/notification.service.js";
import { EVENTS } from "../../lib/events.js";
import leaveBalanceService from "../leave-balances/leave-balance.service.js";
import leaveBalanceRepository from "../leave-balances/leave-balance.repository.js";
import { LEAVE_DEDUCTING_TYPES } from "../leave-balances/leave-balance.model.js";
import { InsufficientLeaveBalanceError } from "../leave-balances/errors/leave-balance.error.js";
import attendanceService from "../attendances/attendance.service.js";
import logger from "../../utils/logger.js";
import { signAttachment, signAttachments } from "./helpers/sign-attachment.js";

const isLeaveDeducting = (type) => LEAVE_DEDUCTING_TYPES.includes(type);

const createPermission = async (userId, payload) => {
  const start = toUtcDayStart(payload.startDate);
  const end = toUtcDayStart(payload.endDate);

  if (end < start) {
    throw new BadRequestError(
      "tanggal akhir tidak boleh sebelum tanggal mulai",
    );
  }

  const duration = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

  if (isLeaveDeducting(payload.type)) {
    const balance = await leaveBalanceService.getMyBalance(
      userId,
      inJakarta(start).year(),
    );

    if (balance.remainingDays < duration) {
      throw new InsufficientLeaveBalanceError({
        remaining: balance.remainingDays,
        requested: duration,
        year: balance.year,
      });
    }
  }

  const created = await permissionRepository.createPermission({
    userId,
    startDate: start,
    endDate: end,
    duration,
    type: payload.type,
    reason: payload.reason,
    attachmentUrl: payload.attachmentUrl,
  });

  notificationService.notifyAllAdmins({
    type: "PERMISSION_SUBMITTED",
    title: "Pengajuan izin baru",
    body: `Karyawan mengajukan izin (${payload.type}) untuk ${formatJakartaDate(start)} - ${formatJakartaDate(end)}`,
    data: {
      permissionId: created.id,
      userId,
      type: payload.type,
    },
    event: EVENTS.PERMISSION_SUBMITTED,
  });

  return await signAttachment(created);
};

const findPermissionByUserId = async (userId) => {
  const data = await permissionRepository.findManyByUserId(userId);
  return await signAttachments(data);
};

const findAllPermissions = async ({
  page = 1,
  limit = 10,
  search,
  type,
  status,
}) => {
  const paging = getPagination(page, limit);

  const { data, total } = await permissionRepository.findAllPermissions({
    skip: paging.skip,
    take: paging.take,
    search,
    type,
    status,
  });

  await signAttachments(data);

  return {
    data,
    pagination: paginationMeta({ total, ...paging }),
  };
};

const findPermissionById = async (id) => {
  const permission = await permissionRepository.findById(id);

  if (!permission) {
    throw new NotFoundError("izin");
  }

  return await signAttachment(permission);
};

const assertPendingPermission = async (id) => {
  const existing = await permissionRepository.findById(id);

  if (!existing) {
    throw new NotFoundError("izin");
  }

  if (existing.status !== "PENDING") {
    throw new ConflictError(
      `izin sudah ${existing.status.toLowerCase()}, tidak bisa diubah`,
    );
  }

  return existing;
};

const approvePermission = async (adminId, id, note) => {
  const existing = await assertPendingPermission(id);

  if (isLeaveDeducting(existing.type)) {
    await leaveBalanceService.initForUser(
      existing.userId,
      inJakarta(existing.startDate).year(),
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (isLeaveDeducting(existing.type)) {
      const year = inJakarta(existing.startDate).year();
      const count = await leaveBalanceRepository.deductDays(
        existing.userId,
        year,
        existing.duration,
        tx,
      );

      if (count === 0) {
        const current = await tx.leaveBalance.findUnique({
          where: { userId_year: { userId: existing.userId, year } },
        });
        throw new InsufficientLeaveBalanceError({
          remaining: current?.remainingDays ?? 0,
          requested: existing.duration,
          year,
        });
      }
    }

    const result = await permissionRepository.updateStatusIfPending(
      id,
      {
        status: "APPROVED",
        approvedBy: adminId,
        approvedNote: note,
        approvedAt: new Date(),
      },
      tx,
    );

    if (!result) {
      throw new ConflictError(
        "izin sudah diproses admin lain, silakan refresh halaman",
      );
    }

    const materialized =
      await attendanceService.materializeForApprovedPermission(result, tx);
    if (materialized.skipped > 0) {
      logger.warn(
        `permission ${result.id} approved: ${materialized.created} attendance row created, ${materialized.skipped} skipped (existing attendance untuk user/tanggal yang sama)`,
      );
    }

    return result;
  });

  notificationService.notifyUser({
    userId: updated.userId,
    type: "PERMISSION_APPROVED",
    title: "Izin disetujui",
    body: `Pengajuan izin (${updated.type}) kamu disetujui${note ? `: ${note}` : ""}`,
    data: { permissionId: updated.id, status: "APPROVED" },
    event: EVENTS.PERMISSION_DECIDED,
  });

  return await signAttachment(updated);
};

const rejectPermission = async (adminId, id, note) => {
  await assertPendingPermission(id);

  const updated = await permissionRepository.updateStatusIfPending(id, {
    status: "REJECTED",
    approvedBy: adminId,
    approvedNote: note,
    approvedAt: new Date(),
  });

  if (!updated) {
    throw new ConflictError(
      "izin sudah diproses admin lain, silakan refresh halaman",
    );
  }

  notificationService.notifyUser({
    userId: updated.userId,
    type: "PERMISSION_REJECTED",
    title: "Izin ditolak",
    body: `Pengajuan izin (${updated.type}) kamu ditolak: ${note}`,
    data: { permissionId: updated.id, status: "REJECTED" },
    event: EVENTS.PERMISSION_DECIDED,
  });

  return await signAttachment(updated);
};

const cancelPermission = async (userId, id) => {
  const existing = await permissionRepository.findById(id);

  if (!existing || existing.userId !== userId) {
    throw new NotFoundError("izin");
  }

  if (existing.status !== "PENDING") {
    throw new ConflictError(
      `izin sudah ${existing.status.toLowerCase()}, tidak bisa dibatalkan`,
    );
  }

  const updated = await permissionRepository.cancelOwnPendingPermission(
    id,
    userId,
  );
  if (!updated) {
    throw new ConflictError("izin sudah diproses admin, tidak bisa dibatalkan");
  }

  notificationService.notifyAllAdmins({
    type: "PERMISSION_CANCELLED",
    title: "Pengajuan izin dibatalkan",
    body: `Karyawan membatalkan pengajuan izin (${updated.type})`,
    data: { permissionId: updated.id, userId, status: "CANCELLED" },
    event: EVENTS.PERMISSION_CANCELLED,
  });

  return await signAttachment(updated);
};

export default {
  createPermission,
  findPermissionByUserId,
  findAllPermissions,
  findPermissionById,
  approvePermission,
  rejectPermission,
  cancelPermission,
};
