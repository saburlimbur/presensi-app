import { describe, expect, test } from "vitest";
import {
  locationLabel,
  startOfWeek,
  workMinutes,
} from "@features/attendance/utils/format";
import type { AttendanceRecord } from "@features/attendance/@types";

const entry = (time: string, locationName?: string) => ({
  time,
  lat: null,
  lng: null,
  locationId: "",
  locationName,
});

const record = (overrides: Partial<AttendanceRecord>): AttendanceRecord => ({
  id: "a1",
  date: "2026-06-01",
  status: "present",
  ...overrides,
});

describe("workMinutes", () => {
  test("belum check-out → 0", () => {
    expect(workMinutes(record({ checkIn: entry("2026-06-01T01:00:00Z") }))).toBe(0);
  });

  test("menghitung selisih check-in dan check-out", () => {
    expect(
      workMinutes(
        record({
          checkIn: entry("2026-06-01T01:00:00Z"),
          checkOut: entry("2026-06-01T09:30:00Z"),
        }),
      ),
    ).toBe(510);
  });

  test("check-out lebih awal dari check-in → 0, bukan negatif", () => {
    expect(
      workMinutes(
        record({
          checkIn: entry("2026-06-01T09:00:00Z"),
          checkOut: entry("2026-06-01T01:00:00Z"),
        }),
      ),
    ).toBe(0);
  });
});

describe("locationLabel", () => {
  test("memakai nama lokasi check-in", () => {
    expect(
      locationLabel(record({ checkIn: entry("2026-06-01T01:00:00Z", "Kantor Pusat") })),
    ).toBe("Kantor Pusat");
  });

  test("WFA tanpa nama lokasi", () => {
    expect(locationLabel(record({ workType: "WFA" }))).toBe("Work From Anywhere");
  });
});

describe("startOfWeek", () => {
  test("Rabu → Senin di minggu yang sama", () => {
    const start = startOfWeek(new Date(2026, 5, 3, 15, 30));
    expect([start.getFullYear(), start.getMonth(), start.getDate()]).toEqual([2026, 5, 1]);
    expect(start.getHours()).toBe(0);
  });

  test("Minggu → Senin sebelumnya, bukan Senin berikutnya", () => {
    const start = startOfWeek(new Date(2026, 5, 7, 8, 0));
    expect([start.getMonth(), start.getDate()]).toEqual([5, 1]);
  });
});
