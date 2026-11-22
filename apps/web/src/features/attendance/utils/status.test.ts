import { describe, expect, test } from "vitest";
import {
  ATTENDANCE_STATUS_META,
  STATUS_TONE_CLASS,
  isAttendanceStatus,
} from "@features/attendance/utils/status";

// Enum AttendanceStatus di apps/api/prisma/schema.prisma.
const API_STATUSES = [
  "PRESENT",
  "LATE",
  "ABSENT",
  "SICK",
  "PERMIT",
  "ON_LEAVE",
  "HOLIDAY",
  "WORK_FROM_HOME",
];

describe("status absensi", () => {
  test.each(API_STATUSES)("status API %s punya label dan warna", (status) => {
    const key = status.toLowerCase();
    expect(isAttendanceStatus(key)).toBe(true);

    const meta = ATTENDANCE_STATUS_META[key as keyof typeof ATTENDANCE_STATUS_META];
    expect(meta.label).not.toBe("");
    expect(STATUS_TONE_CLASS[meta.tone]).toBeDefined();
  });

  test("status tak dikenal ditolak", () => {
    expect(isAttendanceStatus("unknown")).toBe(false);
    expect(isAttendanceStatus("PRESENT")).toBe(false);
  });
});
