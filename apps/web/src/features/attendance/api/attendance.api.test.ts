import { describe, expect, test, vi } from "vitest";

vi.mock("@shared/api/api-service", () => ({ default: {} }));

import {
  normalizeAttendance,
  type RawAttendance,
} from "@features/attendance/api/attendance.api";

// Bentuk record seperti yang dikirim API (model Attendance di Prisma).
const apiRecord = (overrides: Partial<RawAttendance> = {}): RawAttendance => ({
  id: "a1",
  date: "2026-06-01T00:00:00.000Z",
  status: "LATE",
  workMode: "WFO",
  checkIn: "2026-06-01T01:15:00.000Z",
  checkOut: null,
  latitudeIn: -6.2,
  longitudeIn: 106.8,
  gpsAccuracyIn: 12,
  note: "macet",
  deviceInfo: "Android",
  photoIn_url: null,
  metadata: { checkInGeo: { locationName: "Kantor Pusat" } },
  ...overrides,
});

describe("normalizeAttendance", () => {
  test("memetakan record check-in dari API", () => {
    const record = normalizeAttendance(apiRecord());

    expect(record.status).toBe("late");
    expect(record.workType).toBe("WFO");
    expect(record.checkOut).toBeUndefined();
    expect(record.checkIn).toMatchObject({
      time: "2026-06-01T01:15:00.000Z",
      lat: -6.2,
      lng: 106.8,
      locationName: "Kantor Pusat",
      note: "macet",
      gpsAccuracy: 12,
      deviceInfo: "Android",
    });
  });

  test("record yang sudah check-out punya kedua sisi", () => {
    const record = normalizeAttendance(
      apiRecord({
        checkOut: "2026-06-01T10:00:00.000Z",
        latitudeOut: -6.21,
        longitudeOut: 106.81,
        metadata: { checkOutGeo: { locationName: "Kantor Cabang" } },
      }),
    );

    expect(record.checkOut).toMatchObject({
      time: "2026-06-01T10:00:00.000Z",
      lat: -6.21,
      locationName: "Kantor Cabang",
    });
  });

  test.each([
    ["SICK", "sick"],
    ["PERMIT", "permit"],
    ["ON_LEAVE", "on_leave"],
    ["HOLIDAY", "holiday"],
    ["WORK_FROM_HOME", "work_from_home"],
  ])("status %s dari API tetap dikenali", (apiStatus, expected) => {
    const record = normalizeAttendance(
      apiRecord({ status: apiStatus, checkIn: null }),
    );
    expect(record.status).toBe(expected);
    expect(record.checkIn).toBeUndefined();
  });

  test("status tak dikenal jatuh ke present kalau sudah check-in", () => {
    expect(normalizeAttendance(apiRecord({ status: "BARU" })).status).toBe(
      "present",
    );
  });

  test("status tak dikenal tanpa check-in jatuh ke pending", () => {
    expect(
      normalizeAttendance(apiRecord({ status: undefined, checkIn: null }))
        .status,
    ).toBe("pending");
  });
});
