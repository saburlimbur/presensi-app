import { describe, expect, test } from "vitest";
import {
  findNearestLocation,
  haversineMeters,
} from "@features/attendance/utils/geo";

const monas = { name: "Monas", lat: -6.175392, lng: 106.827153, radiusMeters: 100 };
const bandung = { name: "Bandung", lat: -6.917464, lng: 107.619123, radiusMeters: 100 };

describe("haversineMeters", () => {
  test("titik yang sama → 0", () => {
    expect(haversineMeters(monas.lat, monas.lng, monas.lat, monas.lng)).toBe(0);
  });

  test("Jakarta ke Bandung sekitar 120 km", () => {
    const distance = haversineMeters(monas.lat, monas.lng, bandung.lat, bandung.lng);
    expect(distance).toBeGreaterThan(110_000);
    expect(distance).toBeLessThan(125_000);
  });
});

describe("findNearestLocation", () => {
  test("tanpa lokasi terdaftar → di luar radius", () => {
    expect(findNearestLocation(monas, [])).toEqual({
      location: null,
      distance: Infinity,
      inRadius: false,
    });
  });

  test("memilih lokasi terdekat, bukan yang pertama", () => {
    const result = findNearestLocation(
      { lat: -6.9175, lng: 107.6191 },
      [monas, bandung],
    );
    expect(result.location).toBe(bandung);
    expect(result.inRadius).toBe(true);
  });

  test("sekitar 150 m dari kantor dengan radius 100 m → di luar radius", () => {
    const result = findNearestLocation(
      { lat: monas.lat + 0.00135, lng: monas.lng },
      [monas],
    );
    expect(result.distance).toBeGreaterThan(100);
    expect(result.distance).toBeLessThan(200);
    expect(result.inRadius).toBe(false);
  });
});
