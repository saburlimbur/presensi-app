import faceService from "../../../src/modules/faces/face.service.js";
import faceRepository from "../../../src/modules/faces/face.repository.js";
import facePool from "../../../src/modules/faces/face-pool.js";
import { BadRequestError, ConflictError } from "../../../src/utils/error.js";

vi.mock("../../../src/modules/faces/face-pool.js", () => ({
  __esModule: true,
  default: { embed: vi.fn(), init: vi.fn(), shutdown: vi.fn() },
}));
vi.mock("../../../src/modules/faces/face.repository.js", () => ({
  __esModule: true,
  default: {
    findAll: vi.fn(),
    findByUserId: vi.fn(),
    countByUserId: vi.fn(),
  },
}));
vi.mock("../../../src/lib/prisma.js", () => ({
  __esModule: true,
  default: { $transaction: vi.fn() },
}));

const setEmbedding = (descriptor) => facePool.embed.mockResolvedValue(descriptor);
const setEmbedError = (code) => {
  const err = new Error(code);
  err.code = code;
  facePool.embed.mockRejectedValue(err);
};

beforeEach(() => {
  vi.clearAllMocks();
  faceService.invalidateCache();
});

describe("generateEmbedding", () => {
  test("worker tak menemukan wajah (NO_FACE) → BadRequestError", async () => {
    setEmbedError("NO_FACE");
    await expect(faceService.generateEmbedding("x.jpg")).rejects.toThrow(
      BadRequestError,
    );
  });

  test("worker mendeteksi >1 wajah (MULTI_FACE) → BadRequestError", async () => {
    setEmbedError("MULTI_FACE");
    await expect(faceService.generateEmbedding("x.jpg")).rejects.toThrow(
      BadRequestError,
    );
  });

  test("tepat 1 wajah → kembalikan descriptor sebagai array", async () => {
    setEmbedding([1, 2, 3]);
    await expect(faceService.generateEmbedding("x.jpg")).resolves.toEqual([
      1, 2, 3,
    ]);
  });
});

describe("recognizeFace", () => {
  test("belum ada wajah terdaftar → BadRequestError", async () => {
    setEmbedding([0, 0, 0]);
    faceRepository.findAll.mockResolvedValue([]);
    await expect(faceService.recognizeFace("x.jpg")).rejects.toThrow(
      BadRequestError,
    );
  });

  test("semua kandidat di luar threshold (>0.5) → null (tidak dikenali)", async () => {
    setEmbedding([0, 0, 0]);
    faceRepository.findAll.mockResolvedValue([
      { userId: "A", embedding: [0.6, 0, 0] },
    ]);
    await expect(faceService.recognizeFace("x.jpg")).resolves.toBeNull();
  });

  test("ambigu — dua user beda nyaris sama dekat (selisih < margin 0.05) → null", async () => {
    setEmbedding([0, 0, 0]);
    faceRepository.findAll.mockResolvedValue([
      { userId: "A", embedding: [0.3, 0, 0] },
      { userId: "B", embedding: [0.33, 0, 0] },
    ]);
    await expect(faceService.recognizeFace("x.jpg")).resolves.toBeNull();
  });

  test("match jelas → kembalikan userId, distance, confidence", async () => {
    setEmbedding([0, 0, 0]);
    faceRepository.findAll.mockResolvedValue([
      { userId: "A", embedding: [0.1, 0, 0] },
      { userId: "B", embedding: [0.9, 0, 0] },
    ]);
    const result = await faceService.recognizeFace("x.jpg");
    expect(result.userId).toBe("A");
    expect(result.distance).toBeCloseTo(0.1, 5);
    expect(result.confidence).toBe(80);
  });

  test("ambil jarak TERDEKAT per user saat satu user punya banyak embedding", async () => {
    setEmbedding([0, 0, 0]);
    faceRepository.findAll.mockResolvedValue([
      { userId: "A", embedding: [0.4, 0, 0] },
      { userId: "A", embedding: [0.05, 0, 0] },
      { userId: "B", embedding: [0.45, 0, 0] },
    ]);
    const result = await faceService.recognizeFace("x.jpg");
    expect(result.userId).toBe("A");
    expect(result.distance).toBeCloseTo(0.05, 5);
  });
});

describe("enrollFace — guard sebelum transaksi", () => {
  test("foto kurang dari minimal (3) → BadRequestError", async () => {
    await expect(
      faceService.enrollFace(1, [
        { path: "/nonexistent/a.jpg", filename: "a.jpg" },
        { path: "/nonexistent/b.jpg", filename: "b.jpg" },
      ]),
    ).rejects.toThrow(BadRequestError);
  });

  test("melebihi kuota per user (existing + baru > 10) → ConflictError", async () => {
    faceRepository.countByUserId.mockResolvedValue(9);
    await expect(
      faceService.enrollFace(1, [
        { path: "/nonexistent/a.jpg", filename: "a.jpg" },
        { path: "/nonexistent/b.jpg", filename: "b.jpg" },
        { path: "/nonexistent/c.jpg", filename: "c.jpg" },
      ]),
    ).rejects.toThrow(ConflictError);
  });
});
