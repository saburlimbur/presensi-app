import shiftsService from "../../../src/modules/shifts/shifts.service.js";
import shiftsRepository from "../../../src/modules/shifts/shifts.repository.js";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../../../src/utils/error.js";

vi.mock("../../../src/modules/shifts/shifts.repository.js", () => ({
  __esModule: true,
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByName: vi.fn(),
    findActiveShift: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateAndSetActive: vi.fn(),
    destroy: vi.fn(),
  },
}));

beforeEach(() => vi.clearAllMocks());

const times = (start, end) => ({
  name: "Pagi",
  startTime: `2026-01-01T${start}:00Z`,
  endTime: `2026-01-01T${end}:00Z`,
});

describe("createNewShift", () => {
  test("startTime >= endTime → BadRequestError", async () => {
    await expect(
      shiftsService.createNewShift(times("10:00", "09:00")),
    ).rejects.toThrow(BadRequestError);
  });

  test("nama duplikat → ConflictError", async () => {
    shiftsRepository.findByName.mockResolvedValue({ id: "s1" });
    await expect(
      shiftsService.createNewShift(times("08:00", "17:00")),
    ).rejects.toThrow(ConflictError);
    expect(shiftsRepository.create).not.toHaveBeenCalled();
  });

  test("shift baru aktif → set active via updateAndSetActive", async () => {
    shiftsRepository.findByName.mockResolvedValue(null);
    shiftsRepository.create.mockResolvedValue({ id: "s1", isActive: true });
    shiftsRepository.updateAndSetActive.mockResolvedValue({ id: "s1" });
    await shiftsService.createNewShift(times("08:00", "17:00"));
    expect(shiftsRepository.updateAndSetActive).toHaveBeenCalledWith("s1", {});
  });

  test("shift baru non-aktif → kembalikan hasil create apa adanya", async () => {
    shiftsRepository.findByName.mockResolvedValue(null);
    const created = { id: "s1", isActive: false };
    shiftsRepository.create.mockResolvedValue(created);
    const result = await shiftsService.createNewShift(times("08:00", "17:00"));
    expect(result).toBe(created);
    expect(shiftsRepository.updateAndSetActive).not.toHaveBeenCalled();
  });
});

describe("updateShift", () => {
  test("id tidak ada → NotFoundError", async () => {
    shiftsRepository.findById.mockResolvedValue(null);
    await expect(
      shiftsService.updateShift("x", { name: "A" }),
    ).rejects.toThrow(NotFoundError);
  });

  test("gabungan start baru vs end lama jadi tidak valid → BadRequestError", async () => {
    shiftsRepository.findById.mockResolvedValue({
      id: "s1",
      startTime: new Date("2026-01-01T08:00:00Z"),
      endTime: new Date("2026-01-01T17:00:00Z"),
    });
    await expect(
      shiftsService.updateShift("s1", { startTime: "2026-01-01T18:00:00Z" }),
    ).rejects.toThrow(BadRequestError);
  });

  test("isActive=true → updateAndSetActive", async () => {
    shiftsRepository.findById.mockResolvedValue({
      id: "s1",
      startTime: new Date("2026-01-01T08:00:00Z"),
      endTime: new Date("2026-01-01T17:00:00Z"),
    });
    await shiftsService.updateShift("s1", { isActive: true });
    expect(shiftsRepository.updateAndSetActive).toHaveBeenCalled();
    expect(shiftsRepository.update).not.toHaveBeenCalled();
  });

  test("update biasa → repository.update", async () => {
    shiftsRepository.findById.mockResolvedValue({
      id: "s1",
      startTime: new Date("2026-01-01T08:00:00Z"),
      endTime: new Date("2026-01-01T17:00:00Z"),
    });
    await shiftsService.updateShift("s1", { description: "x" });
    expect(shiftsRepository.update).toHaveBeenCalledWith("s1", {
      description: "x",
    });
  });
});

describe("updateShift dengan jam dari kolom Time (tanggal 1970)", () => {
  const existing = {
    id: "s1",
    startTime: new Date("1970-01-01T08:00:00.000Z"),
    endTime: new Date("1970-01-01T17:00:00.000Z"),
  };

  test("hanya startTime, masih sebelum end lama → lolos", async () => {
    shiftsRepository.findById.mockResolvedValue(existing);
    shiftsRepository.update.mockResolvedValue({ id: "s1" });
    await shiftsService.updateShift("s1", {
      startTime: "2026-06-01T09:00:00.000Z",
    });
    expect(shiftsRepository.update).toHaveBeenCalled();
  });

  test("hanya endTime, lebih awal dari start lama → BadRequestError", async () => {
    shiftsRepository.findById.mockResolvedValue(existing);
    await expect(
      shiftsService.updateShift("s1", { endTime: "2026-06-01T07:00:00.000Z" }),
    ).rejects.toThrow(BadRequestError);
  });
});

describe("deleteShift", () => {
  test("id tidak ada → NotFoundError", async () => {
    shiftsRepository.findById.mockResolvedValue(null);
    await expect(shiftsService.deleteShift("x")).rejects.toThrow(NotFoundError);
  });

  test("ada → destroy", async () => {
    shiftsRepository.findById.mockResolvedValue({ id: "s1" });
    await shiftsService.deleteShift("s1");
    expect(shiftsRepository.destroy).toHaveBeenCalledWith("s1");
  });
});
