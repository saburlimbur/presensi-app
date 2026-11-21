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
});
