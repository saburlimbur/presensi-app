import reportsService from "../../../src/modules/reports/reports.service.js";
import reportsRepository from "../../../src/modules/reports/reports.repository.js";
import { BadRequestError } from "../../../src/utils/error.js";

vi.mock("../../../src/modules/reports/reports.repository.js", () => ({
  __esModule: true,
  default: { findAttendancesInRange: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());

const sampleUser = () => ({
  id: "u1",
  employeeId: "EMP-001",
  fullName: "Andi",
  position: "STAFF",
  department: { name: "IT" },
  attendances: [
    {
      status: "PRESENT",
      checkIn: "2026-06-01T01:00:00Z",
      checkOut: "2026-06-01T09:00:00Z",
    },
    {
      status: "LATE",
      checkIn: "2026-06-02T02:00:00Z",
      checkOut: "2026-06-02T10:00:00Z",
    },
    { status: "SICK", checkIn: null, checkOut: null },
    { status: "PERMIT", checkIn: null, checkOut: null },
    { status: "ABSENT", checkIn: null, checkOut: null },
    { status: "ON_LEAVE", checkIn: null, checkOut: null },
    {
      status: "WORK_FROM_HOME",
      checkIn: "2026-06-05T01:00:00Z",
      checkOut: "2026-06-05T05:30:00Z",
    },
  ],
});

describe("agregasi laporan (aggregateUser + buildSummary)", () => {
  test("hitung counter per status + total jam kerja per karyawan", async () => {
    reportsRepository.findAttendancesInRange.mockResolvedValue([sampleUser()]);

    const report = await reportsService.getRangeAttendanceReport({
      from: "2026-06-01",
      to: "2026-06-07",
    });

    const detail = report.details[0];
    expect(detail).toMatchObject({
      userId: "u1",
      employeeId: "EMP-001",
      department: "IT",
      present: 1,
      late: 1,
      absent: 1,
      permit: 2,
      leave: 1,
      wfh: 1,
    });
    expect(detail.totalWorkHours).toBe(20.5);
  });

  test("summary menjumlahkan seluruh karyawan", async () => {
    reportsRepository.findAttendancesInRange.mockResolvedValue([sampleUser()]);
    const report = await reportsService.getRangeAttendanceReport({
      from: "2026-06-01",
      to: "2026-06-07",
    });
    expect(report.summary).toMatchObject({
      totalEmployees: 1,
      totalPresent: 1,
      totalLate: 1,
      totalAbsent: 1,
      totalPermit: 2,
      totalLeave: 1,
      totalWfh: 1,
    });
  });

  test("department null saat user tanpa department", async () => {
    reportsRepository.findAttendancesInRange.mockResolvedValue([
      { id: "u2", attendances: [], department: null },
    ]);
    const report = await reportsService.getRangeAttendanceReport({
      from: "2026-06-01",
      to: "2026-06-07",
    });
    expect(report.details[0].department).toBeNull();
    expect(report.details[0].totalWorkHours).toBe(0);
  });
});

describe("countWorkdaysInRange (via period.workDays)", () => {
  beforeEach(() =>
    reportsRepository.findAttendancesInRange.mockResolvedValue([]),
  );

  test("1 hari kerja (Senin 2026-06-01) → 1", async () => {
    const report = await reportsService.getRangeAttendanceReport({
      from: "2026-06-01",
      to: "2026-06-01",
    });
    expect(report.period.workDays).toBe(1);
  });

  test("akhir pekan saja (Sabtu-Minggu 2026-06-06..07) → 0", async () => {
    const report = await reportsService.getRangeAttendanceReport({
      from: "2026-06-06",
      to: "2026-06-07",
    });
    expect(report.period.workDays).toBe(0);
  });

  test("satu minggu penuh (Sen-Min) → 5 hari kerja", async () => {
    const report = await reportsService.getRangeAttendanceReport({
      from: "2026-06-01",
      to: "2026-06-07",
    });
    expect(report.period.workDays).toBe(5);
  });

  test("laporan mingguan selalu 5 hari kerja (7 hari berturut = 5 weekday)", async () => {
    const report = await reportsService.getWeeklyAttendanceReport({
      weekStart: "2026-06-03",
    });
    expect(report.period.workDays).toBe(5);
  });
});

describe("getRangeAttendanceReport — guard rentang", () => {
  test("rentang > 366 hari → BadRequestError", async () => {
    await expect(
      reportsService.getRangeAttendanceReport({
        from: "2025-01-01",
        to: "2026-12-31",
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
