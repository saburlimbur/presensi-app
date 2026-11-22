import app from "../../../src/app.js";
import tokens from "../../../src/lib/tokens.js";
import attendanceService from "../../../src/modules/attendances/attendance.service.js";
import userRepository from "../../../src/modules/users/user.repository.js";
import { BadRequestError } from "../../../src/utils/error.js";

vi.mock("../../../src/modules/attendances/attendance.service.js", () => ({
  __esModule: true,
  default: { checkIn: vi.fn(), checkOut: vi.fn(), getToday: vi.fn() },
}));
vi.mock("../../../src/modules/users/user.repository.js", () => ({
  __esModule: true,
  default: { findById: vi.fn() },
}));

const USER = {
  id: "u1",
  fullName: "Budi",
  email: "budi@example.com",
  role: "EMPLOYEE",
  isActive: true,
};

const checkInBody = (faceToken) => ({
  workMode: "WFO",
  latitude: -6.2,
  longitude: 106.8,
  faceToken,
});

describe("attendance endpoints", () => {
  let server;
  let baseUrl;
  let accessToken;

  const post = (path, body, token = accessToken) =>
    fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    accessToken = tokens.generateAccessToken(USER);

    server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}/attendance_api`;
  });

  afterAll(() => new Promise((resolve) => server.close(resolve)));

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository.findById.mockResolvedValue(USER);
    attendanceService.checkIn.mockResolvedValue({ id: "a1" });
    attendanceService.checkOut.mockResolvedValue({ id: "a1" });
  });

  test("tanpa access token → 401", async () => {
    const response = await post("/attendance/check-in", checkInBody("x"), null);
    expect(response.status).toBe(401);
    expect(attendanceService.checkIn).not.toHaveBeenCalled();
  });

  test("face token dipakai sebagai access token → 401", async () => {
    const faceToken = tokens.generateFaceToken(USER.id);
    const response = await post(
      "/attendance/check-in",
      checkInBody(faceToken),
      faceToken,
    );
    expect(response.status).toBe(401);
  });

  test("check-in tanpa faceToken → 400", async () => {
    const { faceToken, ...body } = checkInBody("x");
    const response = await post("/attendance/check-in", body);
    expect(response.status).toBe(400);
    expect(attendanceService.checkIn).not.toHaveBeenCalled();
  });

  test("check-in dengan faceToken palsu → 403", async () => {
    const response = await post("/attendance/check-in", checkInBody("palsu"));
    const payload = await response.json();
    expect(response.status).toBe(403);
    expect(payload.code).toBe("FACE_VERIFICATION_REQUIRED");
    expect(attendanceService.checkIn).not.toHaveBeenCalled();
  });

  test("check-in dengan faceToken milik user lain → 403", async () => {
    const response = await post(
      "/attendance/check-in",
      checkInBody(tokens.generateFaceToken("u2")),
    );
    expect(response.status).toBe(403);
  });

  test("check-in sukses → 201, faceToken tidak ikut diteruskan ke service", async () => {
    const response = await post(
      "/attendance/check-in",
      checkInBody(tokens.generateFaceToken(USER.id)),
    );
    expect(response.status).toBe(201);

    const [userId, value] = attendanceService.checkIn.mock.calls[0];
    expect(userId).toBe(USER.id);
    expect(value).not.toHaveProperty("faceToken");
  });

  test("faceToken yang sudah dipakai check-in ditolak untuk check-out", async () => {
    const faceToken = tokens.generateFaceToken(USER.id);

    const first = await post("/attendance/check-in", checkInBody(faceToken));
    expect(first.status).toBe(201);

    const second = await post("/attendance/check-out", {
      latitude: -6.2,
      longitude: 106.8,
      faceToken,
    });
    expect(second.status).toBe(403);
    expect(attendanceService.checkOut).not.toHaveBeenCalled();
  });

  test("check-in gagal (di luar radius) → faceToken masih bisa dipakai lagi", async () => {
    const faceToken = tokens.generateFaceToken(USER.id);
    attendanceService.checkIn.mockRejectedValueOnce(
      new BadRequestError("anda berada di luar radius lokasi kantor."),
    );

    const failed = await post("/attendance/check-in", checkInBody(faceToken));
    expect(failed.status).toBe(400);

    const retried = await post("/attendance/check-in", checkInBody(faceToken));
    expect(retried.status).toBe(201);
  });

  test("dua request bersamaan dengan faceToken yang sama → hanya satu yang lolos", async () => {
    const faceToken = tokens.generateFaceToken(USER.id);
    attendanceService.checkIn.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ id: "a1" }), 50)),
    );

    const responses = await Promise.all([
      post("/attendance/check-in", checkInBody(faceToken)),
      post("/attendance/check-in", checkInBody(faceToken)),
    ]);

    expect(responses.map((r) => r.status).sort()).toEqual([201, 403]);
    expect(attendanceService.checkIn).toHaveBeenCalledTimes(1);
  });
});
