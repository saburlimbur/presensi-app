import {
  toUtcDayStart,
  toUtcNextDayStart,
  addDaysUtcStart,
  minutesOfDayJakarta,
  minutesOfDayFromDbTime,
  formatJakartaDate,
} from "../../src/utils/date.js";


describe("date utils — konvensi timezone Jakarta", () => {
  test("toUtcDayStart: ambil tanggal jakarta, kembalikan utc midnight-nya", () => {
    expect(toUtcDayStart("2026-06-01T10:00:00Z").toISOString()).toBe(
      "2026-06-01T00:00:00.000Z",
    );
  });

  test("toUtcDayStart: request lewat tengah malam WIB tidak geser hari", () => {
    expect(toUtcDayStart("2026-06-01T17:30:00Z").toISOString()).toBe(
      "2026-06-02T00:00:00.000Z",
    );
  });

  test("toUtcDayStart: tepat batas tengah malam WIB", () => {
    expect(toUtcDayStart("2026-06-01T16:59:59Z").toISOString()).toBe(
      "2026-06-01T00:00:00.000Z",
    );
    expect(toUtcDayStart("2026-06-01T17:00:00Z").toISOString()).toBe(
      "2026-06-02T00:00:00.000Z",
    );
  });

  test("toUtcNextDayStart: pasangan lt untuk range query, +24 jam dari day start", () => {
    expect(toUtcNextDayStart("2026-06-01T10:00:00Z").toISOString()).toBe(
      "2026-06-02T00:00:00.000Z",
    );
  });

  test("addDaysUtcStart: geser N hari dari day start jakarta", () => {
    expect(addDaysUtcStart("2026-06-01T10:00:00Z", 5).toISOString()).toBe(
      "2026-06-06T00:00:00.000Z",
    );
    expect(addDaysUtcStart("2026-06-01T10:00:00Z", -1).toISOString()).toBe(
      "2026-05-31T00:00:00.000Z",
    );
  });

  test("minutesOfDayJakarta: menit-of-day berdasarkan jam WIB", () => {
    expect(minutesOfDayJakarta("2026-06-01T01:30:00Z")).toBe(510);
    expect(minutesOfDayJakarta("2026-06-01T16:00:00Z")).toBe(23 * 60);
  });

  test("minutesOfDayFromDbTime: kolom @db.time pakai getUTC*, bukan getHours", () => {
    expect(minutesOfDayFromDbTime("1970-01-01T08:00:00.000Z")).toBe(480);
    expect(minutesOfDayFromDbTime(new Date("1970-01-01T17:30:00.000Z"))).toBe(
      1050,
    );
  });

  test("konsistensi: dua helper menit dibandingkan di sumbu yang sama", () => {
    const shiftStart = minutesOfDayFromDbTime("1970-01-01T08:00:00.000Z");
    const checkIn = minutesOfDayJakarta("2026-06-01T01:30:00Z");
    expect(checkIn - shiftStart).toBe(30);
  });

  test("formatJakartaDate: format tanggal WIB, bukan tanggal UTC", () => {
    expect(formatJakartaDate("2026-06-01T17:30:00Z")).toBe("2026-06-02");
    expect(formatJakartaDate("2026-06-01T10:00:00Z")).toBe("2026-06-01");
  });
});
