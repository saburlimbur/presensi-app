import locationsService from "../../../src/modules/locations/locations.service.js";
import locationsRepository from "../../../src/modules/locations/locations.repository.js";
import { NotFoundError, ConflictError } from "../../../src/utils/error.js";

vi.mock("../../../src/modules/locations/locations.repository.js", () => ({
  __esModule: true,
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByName: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
}));

beforeEach(() => vi.clearAllMocks());

describe("getAllLocations", () => {
  test("skip + totalPage benar", async () => {
    locationsRepository.findAll.mockResolvedValue({ data: [], total: 12 });
    const result = await locationsService.getAllLocations({ page: 2, limit: 5 });
    expect(locationsRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 }),
    );
    expect(result.pagination).toMatchObject({ total: 12, totalPages: 3 });
  });

  test("page/limit non-numerik → fallback ke 1/10", async () => {
    locationsRepository.findAll.mockResolvedValue({ data: [], total: 0 });
    const result = await locationsService.getAllLocations({});
    expect(result.pagination).toMatchObject({ page: 1, limit: 10 });
  });
});

describe("getLocationById", () => {
  test("tidak ada → NotFoundError", async () => {
    locationsRepository.findById.mockResolvedValue(null);
    await expect(locationsService.getLocationById("x")).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe("createLocation", () => {
  test("nama duplikat → ConflictError", async () => {
    locationsRepository.findByName.mockResolvedValue({ id: "l1" });
    await expect(
      locationsService.createLocation({ name: "Kantor" }),
    ).rejects.toThrow(ConflictError);
    expect(locationsRepository.create).not.toHaveBeenCalled();
  });

  test("nama unik → create", async () => {
    locationsRepository.findByName.mockResolvedValue(null);
    const data = { name: "Kantor" };
    await locationsService.createLocation(data);
    expect(locationsRepository.create).toHaveBeenCalledWith(data);
  });
});

describe("updateLocation", () => {
  test("tidak ada → NotFoundError", async () => {
    locationsRepository.findById.mockResolvedValue(null);
    await expect(
      locationsService.updateLocation("x", { name: "A" }),
    ).rejects.toThrow(NotFoundError);
  });

  test("ganti nama ke nama yang sudah ada → ConflictError", async () => {
    locationsRepository.findById.mockResolvedValue({ id: "l1", name: "Lama" });
    locationsRepository.findByName.mockResolvedValue({ id: "l2" });
    await expect(
      locationsService.updateLocation("l1", { name: "Baru" }),
    ).rejects.toThrow(ConflictError);
  });

  test("nama tidak berubah → lewati cek & update", async () => {
    locationsRepository.findById.mockResolvedValue({ id: "l1", name: "Kantor" });
    await locationsService.updateLocation("l1", { isActive: false });
    expect(locationsRepository.findByName).not.toHaveBeenCalled();
    expect(locationsRepository.update).toHaveBeenCalledWith("l1", {
      isActive: false,
    });
  });
});

describe("deleteLocation", () => {
  test("tidak ada → NotFoundError", async () => {
    locationsRepository.findById.mockResolvedValue(null);
    await expect(locationsService.deleteLocation("x")).rejects.toThrow(
      NotFoundError,
    );
  });

  test("ada → softDelete (bukan hard delete)", async () => {
    locationsRepository.findById.mockResolvedValue({ id: "l1" });
    await locationsService.deleteLocation("l1");
    expect(locationsRepository.softDelete).toHaveBeenCalledWith("l1");
  });
});
