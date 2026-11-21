import attendanceService from "../../../src/modules/attendances/attendance.service.js";
import attendanceRepository from "../../../src/modules/attendances/attendance.repository.js";
import shiftsRepository from "../../../src/modules/shifts/shifts.repository.js";
import permissionRepository from "../../../src/modules/permissions/permission.repository.js";
import {
  AlreadyCheckedInError,
  AlreadyCheckedOutError,
  NotCheckedInError,
  CheckOutWindowExpiredError,
} from "../../../src/modules/attendances/errors/attendance.error.js";
import { BadRequestError, ConflictError } from "../../../src/utils/error.js";

vi.mock("../../../src/modules/attendances/attendance.repository.js", () => ({
  __esModule: true,
  default: {
    checkExistence: vi.fn(),
    findActiveLocations: vi.fn(),
    create: vi.fn(),
    findLatestOpenSession: vi.fn(),
    findOpenBeforeToday: vi.fn(),
    findByUserAndDate: vi.fn(),
    markCheckedOut: vi.fn(),
    findByIdWithRelations: vi.fn(),
    createManyForLeave: vi.fn(),
    summaryByDate: vi.fn(),
  },
}));
vi.mock("../../../src/modules/shifts/shifts.repository.js", () => ({
  __esModule: true,
  default: { findActiveShift: vi.fn() },
}));
vi.mock("../../../src/modules/permissions/permission.repository.js", () => ({
  __esModule: true,
  default: { findActiveApprovedForUserOnDate: vi.fn() },
}));
vi.mock("../../../src/modules/notifications/notification.service.js", () => ({
  __esModule: true,
  default: { notifyAllAdmins: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  permissionRepository.findActiveApprovedForUserOnDate.mockResolvedValue(null);
  shiftsRepository.findActiveShift.mockResolvedValue(null);
});

describe("checkIn", () => {
  test("sudah check-in hari ini → AlreadyCheckedInError", async () => {
    attendanceRepository.checkExistence.mockResolvedValue({ exists: true });
    await expect(
      attendanceService.checkIn(1, { workMode: "WFA" }),
    ).rejects.toThrow(AlreadyCheckedInError);
    expect(attendanceRepository.create).not.toHaveBeenCalled();
  });

  test("izin leave-like yang sudah approved → ConflictError (tolak check-in)", async () => {
    attendanceRepository.checkExistence.mockResolvedValue({ exists: false });
    permissionRepository.findActiveApprovedForUserOnDate.mockResolvedValue({
      id: 9,
      type: "ANNUAL_LEAVE",
    });
    await expect(
      attendanceService.checkIn(1, { workMode: "WFA" }),
    ).rejects.toThrow(ConflictError);
    expect(attendanceRepository.create).not.toHaveBeenCalled();
  });

  test("WFH approved → override workMode=WFA, status WORK_FROM_HOME, skip validasi lokasi", async () => {
    attendanceRepository.checkExistence.mockResolvedValue({ exists: false });
    permissionRepository.findActiveApprovedForUserOnDate.mockResolvedValue({
      id: 7,
      type: "WORK_FROM_HOME",
    });
    attendanceRepository.create.mockResolvedValue({ id: 100 });

    await attendanceService.checkIn(1, { workMode: "WFO" });

    expect(attendanceRepository.findActiveLocations).not.toHaveBeenCalled();
    const payload = attendanceRepository.create.mock.calls[0][0];
    expect(payload.workMode).toBe("WFA");
    expect(payload.status).toBe("WORK_FROM_HOME");
    expect(payload.isLocationValid).toBeNull();
    expect(payload.permissionId).toBe(7);
  });

  test("WFO di luar radius semua lokasi → BadRequestError", async () => {
    attendanceRepository.checkExistence.mockResolvedValue({ exists: false });
    attendanceRepository.findActiveLocations.mockResolvedValue([
      { id: "loc1", name: "HQ", latitude: -6.2, longitude: 106.8, radius: 100 },
    ]);
    await expect(
      attendanceService.checkIn(1, {
        workMode: "WFO",
        latitude: -6.9,
        longitude: 107.6,
        gpsAccuracy: 10,
      }),
    ).rejects.toThrow(BadRequestError);
    expect(attendanceRepository.create).not.toHaveBeenCalled();
  });

  test("WFO di dalam radius → isLocationValid true + metadata checkInGeo", async () => {
    attendanceRepository.checkExistence.mockResolvedValue({ exists: false });
    attendanceRepository.findActiveLocations.mockResolvedValue([
      { id: "loc1", name: "HQ", latitude: -6.2, longitude: 106.8, radius: 100 },
    ]);
    attendanceRepository.create.mockResolvedValue({ id: 101 });

    await attendanceService.checkIn(1, {
      workMode: "WFO",
      latitude: -6.2,
      longitude: 106.8,
      gpsAccuracy: 10,
    });

    const payload = attendanceRepository.create.mock.calls[0][0];
    expect(payload.isLocationValid).toBe(true);
    expect(payload.metadata.checkInGeo.locationId).toBe("loc1");
    expect(payload.metadata.checkInGeo.distance).toBe(0);
    expect(payload.status).toBe("PRESENT");
  });

  describe("status telat (computeLateStatus, waktu di-fake)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      attendanceRepository.checkExistence.mockResolvedValue({ exists: false });
      attendanceRepository.create.mockResolvedValue({ id: 102 });
      shiftsRepository.findActiveShift.mockResolvedValue({
        name: "Pagi",
        startTime: "1970-01-01T08:00:00.000Z",
        gracePeriod: 15,
      });
    });
    afterEach(() => vi.useRealTimers());

    test("check-in 08:10 WIB (dalam grace) → PRESENT", async () => {
      vi.setSystemTime(new Date("2026-06-01T01:10:00Z"));
      await attendanceService.checkIn(1, { workMode: "WFA" });
      expect(attendanceRepository.create.mock.calls[0][0].status).toBe(
        "PRESENT",
      );
    });

    test("check-in 09:00 WIB (lewat grace) → LATE", async () => {
      vi.setSystemTime(new Date("2026-06-01T02:00:00Z"));
      await attendanceService.checkIn(1, { workMode: "WFA" });
      expect(attendanceRepository.create.mock.calls[0][0].status).toBe("LATE");
    });
  });
});

describe("checkOut", () => {
  test("tidak ada open session → NotCheckedInError", async () => {
    attendanceRepository.findLatestOpenSession.mockResolvedValue(null);
    await expect(attendanceService.checkOut(1, {})).rejects.toThrow(
      NotCheckedInError,
    );
  });

  test("open session lewat batas jam → CheckOutWindowExpiredError, tidak di-check-out", async () => {
    attendanceRepository.findLatestOpenSession.mockResolvedValue({
      id: 5,
      workMode: "WFA",
      metadata: null,
      checkIn: new Date(Date.now() - 19 * 60 * 60 * 1000),
    });
    await expect(attendanceService.checkOut(1, {})).rejects.toThrow(
      CheckOutWindowExpiredError,
    );
    expect(attendanceRepository.markCheckedOut).not.toHaveBeenCalled();
  });

  test("race paralel — markCheckedOut update 0 baris → AlreadyCheckedOutError", async () => {
    attendanceRepository.findLatestOpenSession.mockResolvedValue({
      id: 5,
      workMode: "WFA",
      metadata: null,
      checkIn: new Date(Date.now() - 60 * 60 * 1000),
    });
    attendanceRepository.markCheckedOut.mockResolvedValue(0);
    await expect(attendanceService.checkOut(1, {})).rejects.toThrow(
      AlreadyCheckedOutError,
    );
  });

  test("happy path WFA → markCheckedOut by id, kembalikan record ter-update", async () => {
    attendanceRepository.findLatestOpenSession.mockResolvedValue({
      id: 5,
      workMode: "WFA",
      metadata: null,
      checkIn: new Date(Date.now() - 17 * 60 * 60 * 1000),
    });
    attendanceRepository.markCheckedOut.mockResolvedValue(1);
    const updated = { id: 5, workMode: "WFA", checkOut: new Date() };
    attendanceRepository.findByIdWithRelations.mockResolvedValue(updated);

    const result = await attendanceService.checkOut(1, {});

    expect(attendanceRepository.markCheckedOut).toHaveBeenCalledWith(
      5,
      expect.any(Object),
    );
    expect(result).toBe(updated);
  });
});

describe("getToday — sesi hari sebelumnya yang belum check-out", () => {
  const prevSession = (hoursAgo) => ({
    id: 77,
    date: new Date("2026-06-01T00:00:00Z"),
    checkIn: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
    workMode: "WFO",
  });

  beforeEach(() => {
    attendanceRepository.findByUserAndDate.mockResolvedValue(null);
    attendanceRepository.findOpenBeforeToday.mockResolvedValue(null);
  });

  test("tidak ada sesi terbuka → NOT_CHECKED_IN, unresolvedSession null", async () => {
    const result = await attendanceService.getToday(1);
    expect(result.state).toBe("NOT_CHECKED_IN");
    expect(result.unresolvedSession).toBeNull();
  });

  test("masih dalam batas jam → PENDING_CHECKOUT_PREV_DAY, sesi jadi attendance", async () => {
    const prev = prevSession(10);
    attendanceRepository.findOpenBeforeToday.mockResolvedValue(prev);

    const result = await attendanceService.getToday(1);

    expect(result.state).toBe("PENDING_CHECKOUT_PREV_DAY");
    expect(result.attendance).toBe(prev);
    expect(result.unresolvedSession).toBeNull();
  });

  test("sudah expired → tidak memblokir check-in, dilaporkan di unresolvedSession", async () => {
    attendanceRepository.findOpenBeforeToday.mockResolvedValue(prevSession(30));

    const result = await attendanceService.getToday(1);

    expect(result.state).toBe("NOT_CHECKED_IN");
    expect(result.attendance).toBeNull();
    expect(result.unresolvedSession).toMatchObject({ id: 77, expired: true });
  });

  test("expired + sudah check-in hari ini → state ikut sesi hari ini, peringatan tetap ada", async () => {
    attendanceRepository.findByUserAndDate.mockResolvedValue({
      id: 88,
      checkOut: null,
    });
    attendanceRepository.findOpenBeforeToday.mockResolvedValue(prevSession(30));

    const result = await attendanceService.getToday(1);

    expect(result.state).toBe("WORKING");
    expect(result.attendance.id).toBe(88);
    expect(result.unresolvedSession).toMatchObject({ id: 77, expired: true });
  });
});

describe("materializeForApprovedPermission", () => {
  test("tipe non-leave (WFH) → tidak materialize apa pun", async () => {
    const result = await attendanceService.materializeForApprovedPermission({
      type: "WORK_FROM_HOME",
      userId: 1,
      id: 2,
      startDate: "2026-06-01",
      endDate: "2026-06-03",
    });
    expect(result).toEqual({ created: 0, skipped: 0 });
    expect(attendanceRepository.createManyForLeave).not.toHaveBeenCalled();
  });

  test("cuti 1-3 Juni → generate 3 tanggal inklusif, status ON_LEAVE", async () => {
    attendanceRepository.createManyForLeave.mockResolvedValue({ count: 3 });
    const result = await attendanceService.materializeForApprovedPermission({
      type: "ANNUAL_LEAVE",
      userId: 1,
      id: 2,
      startDate: "2026-06-01",
      endDate: "2026-06-03",
    });

    expect(result).toEqual({ created: 3, skipped: 0 });
    const payload = attendanceRepository.createManyForLeave.mock.calls[0][0];
    expect(payload.dates).toHaveLength(3);
    expect(payload.status).toBe("ON_LEAVE");
  });

  test("idempotent — tanggal yang sudah ada di-skip (count < jumlah hari)", async () => {
    attendanceRepository.createManyForLeave.mockResolvedValue({ count: 2 });
    const result = await attendanceService.materializeForApprovedPermission({
      type: "ANNUAL_LEAVE",
      userId: 1,
      id: 2,
      startDate: "2026-06-01",
      endDate: "2026-06-03",
    });
    expect(result).toEqual({ created: 2, skipped: 1 });
  });
});

describe("exportAdmin", () => {
  test("rentang tanggal > 92 hari → BadRequestError", async () => {
    await expect(
      attendanceService.exportAdmin({
        dateFrom: "2026-01-01",
        dateTo: "2026-12-31",
      }),
    ).rejects.toThrow(BadRequestError);
  });
});

describe("getSummaryAdmin", () => {
  test("mapping count per status & workMode, sisanya default 0", async () => {
    attendanceRepository.summaryByDate.mockResolvedValue({
      byStatus: [{ status: "PRESENT", _count: { _all: 5 } }],
      byWorkMode: [{ workMode: "WFO", _count: { _all: 5 } }],
      total: 5,
    });

    const result = await attendanceService.getSummaryAdmin("2026-06-01");

    expect(result.total).toBe(5);
    expect(result.byStatus.PRESENT).toBe(5);
    expect(result.byStatus.ABSENT).toBe(0);
    expect(result.byWorkMode.WFO).toBe(5);
    expect(result.byWorkMode.WFA).toBe(0);
  });
});
