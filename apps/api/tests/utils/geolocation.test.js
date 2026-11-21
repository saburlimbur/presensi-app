import {
  MAX_GPS_ACCURACY_TOLERANCE,
  effectiveTolerance,
  calculateDistance,
} from "../../src/utils/geolocation.js";

describe("effectiveTolerance — clamp toleransi GPS", () => {
  test("di-clamp ke MAX agar accuracy ngawur tak memperluas geofence", () => {
    expect(effectiveTolerance(9999)).toBe(MAX_GPS_ACCURACY_TOLERANCE);
    expect(effectiveTolerance(MAX_GPS_ACCURACY_TOLERANCE + 1)).toBe(50);
  });

  test("nilai wajar diteruskan apa adanya", () => {
    expect(effectiveTolerance(30)).toBe(30);
    expect(effectiveTolerance(50)).toBe(50);
  });

  test("nilai non-positif / bukan number / NaN → 0", () => {
    expect(effectiveTolerance(0)).toBe(0);
    expect(effectiveTolerance(-5)).toBe(0);
    expect(effectiveTolerance(undefined)).toBe(0);
    expect(effectiveTolerance(null)).toBe(0);
    expect(effectiveTolerance("30")).toBe(0);
    expect(effectiveTolerance(NaN)).toBe(0);
  });
});

describe("calculateDistance — haversine", () => {
  test("titik yang sama → 0 meter", () => {
    expect(calculateDistance(-6.2, 106.8, -6.2, 106.8)).toBe(0);
  });

  test("1 derajat lintang ≈ 111195 m (R=6371km)", () => {
    expect(calculateDistance(0, 0, 1, 0)).toBe(111195);
  });

  test("simetris (urutan titik tidak mengubah jarak)", () => {
    const a = calculateDistance(-6.2, 106.8, -6.21, 106.82);
    const b = calculateDistance(-6.21, 106.82, -6.2, 106.8);
    expect(a).toBe(b);
  });

  test("jarak pendek di sekitar Jakarta masuk akal (~111 m)", () => {
    const d = calculateDistance(-6.2, 106.8, -6.201, 106.8);
    expect(d).toBeGreaterThanOrEqual(109);
    expect(d).toBeLessThanOrEqual(113);
  });
});
