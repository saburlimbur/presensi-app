import permissionService from "../../../src/modules/permissions/permission.service.js";
import permissionRepository from "../../../src/modules/permissions/permission.repository.js";
import prisma from "../../../src/lib/prisma.js";
import leaveBalanceService from "../../../src/modules/leave-balances/leave-balance.service.js";
import leaveBalanceRepository from "../../../src/modules/leave-balances/leave-balance.repository.js";
import attendanceService from "../../../src/modules/attendances/attendance.service.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../../src/utils/error.js";
import { InsufficientLeaveBalanceError } from "../../../src/modules/leave-balances/errors/leave-balance.error.js";

vi.mock("../../../src/modules/permissions/permission.repository.js", () => ({
  __esModule: true,
  default: {
    createPermission: vi.fn(),
    findManyByUserId: vi.fn(),
    findAllPermissions: vi.fn(),
    findById: vi.fn(),
    updateStatusIfPending: vi.fn(),
    cancelOwnPendingPermission: vi.fn(),
  },
}));
vi.mock("../../../src/lib/prisma.js", () => ({
  __esModule: true,
  default: { $transaction: vi.fn() },
}));
vi.mock("../../../src/modules/leave-balances/leave-balance.service.js", () => ({
  __esModule: true,
  default: { getMyBalance: vi.fn(), initForUser: vi.fn() },
}));
vi.mock(
  "../../../src/modules/leave-balances/leave-balance.repository.js",
  () => ({ __esModule: true, default: { deductDays: vi.fn() } }),
);
vi.mock("../../../src/modules/attendances/attendance.service.js", () => ({
  __esModule: true,
  default: { materializeForApprovedPermission: vi.fn() },
}));
vi.mock("../../../src/modules/notifications/notification.service.js", () => ({
  __esModule: true,
  default: { notifyAllAdmins: vi.fn(), notifyUser: vi.fn() },
}));

const makeTx = (remainingDays = 0) => ({
  leaveBalance: { findUnique: vi.fn().mockResolvedValue({ remainingDays }) },
});

beforeEach(() => vi.clearAllMocks());

describe("createPermission", () => {
  test("endDate sebelum startDate → BadRequestError", async () => {
    await expect(
      permissionService.createPermission("u1", {
        type: "ANNUAL_LEAVE",
        startDate: "2026-05-03",
        endDate: "2026-05-01",
      }),
    ).rejects.toThrow(BadRequestError);
  });

  test("durasi inklusif (1-3 Mei = 3 hari) diteruskan ke repo", async () => {
    leaveBalanceService.getMyBalance.mockResolvedValue({
      remainingDays: 5,
      year: 2026,
    });
    permissionRepository.createPermission.mockResolvedValue({ id: 1 });

    await permissionService.createPermission("u1", {
      type: "ANNUAL_LEAVE",
      startDate: "2026-05-01",
      endDate: "2026-05-03",
    });

    expect(permissionRepository.createPermission.mock.calls[0][0].duration).toBe(
      3,
    );
  });

  test("tipe deducting + saldo kurang dari durasi → InsufficientLeaveBalanceError", async () => {
    leaveBalanceService.getMyBalance.mockResolvedValue({
      remainingDays: 2,
      year: 2026,
    });
    await expect(
      permissionService.createPermission("u1", {
        type: "ANNUAL_LEAVE",
        startDate: "2026-05-01",
        endDate: "2026-05-03",
      }),
    ).rejects.toThrow(InsufficientLeaveBalanceError);
    expect(permissionRepository.createPermission).not.toHaveBeenCalled();
  });

  test("tipe non-deducting (SICK) → tidak cek saldo", async () => {
    permissionRepository.createPermission.mockResolvedValue({ id: 1 });
    await permissionService.createPermission("u1", {
      type: "SICK",
      startDate: "2026-05-01",
      endDate: "2026-05-03",
    });
    expect(leaveBalanceService.getMyBalance).not.toHaveBeenCalled();
    expect(permissionRepository.createPermission).toHaveBeenCalled();
  });
});

describe("approvePermission", () => {
  test("izin sudah tidak pending → ConflictError", async () => {
    permissionRepository.findById.mockResolvedValue({
      id: 1,
      status: "APPROVED",
    });
    await expect(
      permissionService.approvePermission("admin1", 1, "ok"),
    ).rejects.toThrow(ConflictError);
  });

  test("izin tidak ada → NotFoundError", async () => {
    permissionRepository.findById.mockResolvedValue(null);
    await expect(
      permissionService.approvePermission("admin1", 1, "ok"),
    ).rejects.toThrow(NotFoundError);
  });

  test("deducting happy path: deduct saldo + update status + materialize", async () => {
    permissionRepository.findById.mockResolvedValue({
      id: 1,
      status: "PENDING",
      type: "ANNUAL_LEAVE",
      userId: "u1",
      startDate: "2026-05-01",
      duration: 3,
    });
    leaveBalanceService.initForUser.mockResolvedValue({});
    leaveBalanceRepository.deductDays.mockResolvedValue(1);
    const result = { id: 1, userId: "u1", type: "ANNUAL_LEAVE" };
    permissionRepository.updateStatusIfPending.mockResolvedValue(result);
    attendanceService.materializeForApprovedPermission.mockResolvedValue({
      created: 3,
      skipped: 0,
    });
    prisma.$transaction.mockImplementation((cb) => cb(makeTx()));

    const updated = await permissionService.approvePermission("admin1", 1, "ok");

    expect(leaveBalanceRepository.deductDays).toHaveBeenCalledWith(
      "u1",
      2026,
      3,
      expect.anything(),
    );
    expect(attendanceService.materializeForApprovedPermission).toHaveBeenCalled();
    expect(updated).toBe(result);
  });

  test("saldo habis di dalam tx (deductDays 0) → InsufficientLeaveBalanceError", async () => {
    permissionRepository.findById.mockResolvedValue({
      id: 1,
      status: "PENDING",
      type: "ANNUAL_LEAVE",
      userId: "u1",
      startDate: "2026-05-01",
      duration: 3,
    });
    leaveBalanceService.initForUser.mockResolvedValue({});
    leaveBalanceRepository.deductDays.mockResolvedValue(0);
    prisma.$transaction.mockImplementation((cb) => cb(makeTx(1)));

    await expect(
      permissionService.approvePermission("admin1", 1, "ok"),
    ).rejects.toThrow(InsufficientLeaveBalanceError);
    expect(permissionRepository.updateStatusIfPending).not.toHaveBeenCalled();
  });

  test("non-deducting (SICK): tidak deduct saldo, tetap materialize", async () => {
    permissionRepository.findById.mockResolvedValue({
      id: 2,
      status: "PENDING",
      type: "SICK",
      userId: "u1",
      startDate: "2026-05-01",
      duration: 2,
    });
    const result = { id: 2, userId: "u1", type: "SICK" };
    permissionRepository.updateStatusIfPending.mockResolvedValue(result);
    attendanceService.materializeForApprovedPermission.mockResolvedValue({
      created: 2,
      skipped: 0,
    });
    prisma.$transaction.mockImplementation((cb) => cb(makeTx()));

    const updated = await permissionService.approvePermission("admin1", 2, null);

    expect(leaveBalanceRepository.deductDays).not.toHaveBeenCalled();
    expect(updated).toBe(result);
  });

  test("race: updateStatusIfPending null (sudah diproses admin lain) → ConflictError", async () => {
    permissionRepository.findById.mockResolvedValue({
      id: 2,
      status: "PENDING",
      type: "SICK",
      userId: "u1",
      startDate: "2026-05-01",
      duration: 2,
    });
    permissionRepository.updateStatusIfPending.mockResolvedValue(null);
    prisma.$transaction.mockImplementation((cb) => cb(makeTx()));

    await expect(
      permissionService.approvePermission("admin1", 2, null),
    ).rejects.toThrow(ConflictError);
  });
});

describe("rejectPermission", () => {
  test("bukan pending → ConflictError", async () => {
    permissionRepository.findById.mockResolvedValue({
      id: 1,
      status: "REJECTED",
    });
    await expect(
      permissionService.rejectPermission("admin1", 1, "no"),
    ).rejects.toThrow(ConflictError);
  });

  test("happy path → status REJECTED", async () => {
    permissionRepository.findById.mockResolvedValue({
      id: 1,
      status: "PENDING",
    });
    const result = { id: 1, userId: "u1", type: "ANNUAL_LEAVE" };
    permissionRepository.updateStatusIfPending.mockResolvedValue(result);
    const updated = await permissionService.rejectPermission("admin1", 1, "no");
    expect(updated).toBe(result);
  });

  test("race: updateStatusIfPending null → ConflictError", async () => {
    permissionRepository.findById.mockResolvedValue({
      id: 1,
      status: "PENDING",
    });
    permissionRepository.updateStatusIfPending.mockResolvedValue(null);
    await expect(
      permissionService.rejectPermission("admin1", 1, "no"),
    ).rejects.toThrow(ConflictError);
  });
});

describe("cancelPermission", () => {
  test("milik user lain → NotFoundError (tidak bocorkan keberadaan izin)", async () => {
    permissionRepository.findById.mockResolvedValue({
      id: 1,
      userId: "lain",
      status: "PENDING",
    });
    await expect(permissionService.cancelPermission("u1", 1)).rejects.toThrow(
      NotFoundError,
    );
  });

  test("bukan pending → ConflictError", async () => {
    permissionRepository.findById.mockResolvedValue({
      id: 1,
      userId: "u1",
      status: "APPROVED",
    });
    await expect(permissionService.cancelPermission("u1", 1)).rejects.toThrow(
      ConflictError,
    );
  });

  test("happy path → CANCELLED", async () => {
    permissionRepository.findById.mockResolvedValue({
      id: 1,
      userId: "u1",
      status: "PENDING",
    });
    const result = { id: 1, userId: "u1", type: "ANNUAL_LEAVE" };
    permissionRepository.cancelOwnPendingPermission.mockResolvedValue(result);
    const updated = await permissionService.cancelPermission("u1", 1);
    expect(updated).toBe(result);
  });

  test("race: cancelOwnPendingPermission null → ConflictError", async () => {
    permissionRepository.findById.mockResolvedValue({
      id: 1,
      userId: "u1",
      status: "PENDING",
    });
    permissionRepository.cancelOwnPendingPermission.mockResolvedValue(null);
    await expect(permissionService.cancelPermission("u1", 1)).rejects.toThrow(
      ConflictError,
    );
  });
});
