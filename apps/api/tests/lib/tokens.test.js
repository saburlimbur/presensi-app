import tokens from "../../src/lib/tokens.js";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret";
});

describe("face token", () => {
  test("token milik user yang sama → valid", () => {
    const token = tokens.generateFaceToken("u1");
    expect(tokens.isValidFaceToken(token, "u1")).toBe(true);
  });

  test("token user lain → ditolak", () => {
    const token = tokens.generateFaceToken("u1");
    expect(tokens.isValidFaceToken(token, "u2")).toBe(false);
  });

  test("access token biasa tidak bisa dipakai sebagai face token", () => {
    const accessToken = tokens.generateAccessToken({ id: "u1", role: "EMPLOYEE" });
    expect(tokens.isValidFaceToken(accessToken, "u1")).toBe(false);
  });

  test("string sembarang atau kosong → ditolak", () => {
    expect(tokens.isValidFaceToken("bukan-token", "u1")).toBe(false);
    expect(tokens.isValidFaceToken(undefined, "u1")).toBe(false);
  });

  test("token sekali pakai: consume kedua ditolak", () => {
    const token = tokens.generateFaceToken("u1");
    expect(tokens.consumeFaceToken(token, "u1")).toEqual(expect.any(String));
    expect(tokens.consumeFaceToken(token, "u1")).toBeNull();
    expect(tokens.isValidFaceToken(token, "u1")).toBe(false);
  });

  test("consume oleh user lain ditolak dan tidak menghanguskan token", () => {
    const token = tokens.generateFaceToken("u1");
    expect(tokens.consumeFaceToken(token, "u2")).toBeNull();
    expect(tokens.consumeFaceToken(token, "u1")).toEqual(expect.any(String));
  });

  test("release mengembalikan token supaya bisa dipakai lagi", () => {
    const token = tokens.generateFaceToken("u1");
    const tokenId = tokens.consumeFaceToken(token, "u1");
    tokens.releaseFaceToken(tokenId);
    expect(tokens.consumeFaceToken(token, "u1")).toBe(tokenId);
  });

  test("dua token untuk user yang sama saling independen", () => {
    const first = tokens.generateFaceToken("u1");
    const second = tokens.generateFaceToken("u1");
    expect(tokens.consumeFaceToken(first, "u1")).not.toBeNull();
    expect(tokens.consumeFaceToken(second, "u1")).not.toBeNull();
  });
});
