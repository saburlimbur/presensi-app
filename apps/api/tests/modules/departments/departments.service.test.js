import departmentsService from "../../../src/modules/departments/departments.service.js";
import departmentsRepository from "../../../src/modules/departments/departments.repository.js";
import { NotFoundError, ConflictError } from "../../../src/utils/error.js";

vi.mock("../../../src/modules/departments/departments.repository.js", () => ({
  __esModule: true,
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteById: vi.fn(),
  },
}));

beforeEach(() => vi.clearAllMocks());

describe("getAllDepartments", () => {
  test("hitung skip + pagination.totalPage dengan benar", async () => {
    departmentsRepository.findAll.mockResolvedValue({ data: [], total: 25 });

    const result = await departmentsService.getAllDepartments({
      page: 2,
      limit: 10,
    });

    expect(departmentsRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    expect(result.pagination).toMatchObject({
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
  });
});

describe("getDepartmentById / getDepartmentByCode", () => {
  test("id tidak ada → NotFoundError", async () => {
    departmentsRepository.findById.mockResolvedValue(null);
    await expect(departmentsService.getDepartmentById("x")).rejects.toThrow(
      NotFoundError,
    );
  });

  test("code tidak ada → NotFoundError", async () => {
    departmentsRepository.findByCode.mockResolvedValue(null);
    await expect(departmentsService.getDepartmentByCode("IT")).rejects.toThrow(
      NotFoundError,
    );
  });

  test("ditemukan → kembalikan data", async () => {
    const dep = { id: "d1", code: "IT" };
    departmentsRepository.findById.mockResolvedValue(dep);
    await expect(departmentsService.getDepartmentById("d1")).resolves.toBe(dep);
  });
});

describe("createDepartment", () => {
  test("kode sudah dipakai → ConflictError", async () => {
    departmentsRepository.findByCode.mockResolvedValue({ id: "d1" });
    await expect(
      departmentsService.createDepartment({ name: "IT", code: "IT" }),
    ).rejects.toThrow(ConflictError);
    expect(departmentsRepository.create).not.toHaveBeenCalled();
  });

  test("kode unik → panggil repository.create", async () => {
    departmentsRepository.findByCode.mockResolvedValue(null);
    departmentsRepository.create.mockResolvedValue({ id: "d1" });
    const data = { name: "IT", code: "IT" };
    await departmentsService.createDepartment(data);
    expect(departmentsRepository.create).toHaveBeenCalledWith(data);
  });
});

describe("updateDepartment", () => {
  test("id tidak ada → NotFoundError", async () => {
    departmentsRepository.findById.mockResolvedValue(null);
    await expect(
      departmentsService.updateDepartment("x", { name: "IT" }),
    ).rejects.toThrow(NotFoundError);
  });

  test("ganti kode ke kode yang sudah dipakai → ConflictError", async () => {
    departmentsRepository.findById.mockResolvedValue({ id: "d1", code: "OLD" });
    departmentsRepository.findByCode.mockResolvedValue({ id: "d2" });
    await expect(
      departmentsService.updateDepartment("d1", { code: "NEW" }),
    ).rejects.toThrow(ConflictError);
    expect(departmentsRepository.update).not.toHaveBeenCalled();
  });

  test("kode tidak berubah → lewati cek konflik & update", async () => {
    departmentsRepository.findById.mockResolvedValue({ id: "d1", code: "IT" });
    departmentsRepository.update.mockResolvedValue({ id: "d1", name: "Infra" });
    await departmentsService.updateDepartment("d1", { name: "Infra" });
    expect(departmentsRepository.findByCode).not.toHaveBeenCalled();
    expect(departmentsRepository.update).toHaveBeenCalledWith("d1", {
      name: "Infra",
    });
  });
});

describe("headId bermasalah", () => {
  test("headId sudah dipakai department lain → ConflictError", async () => {
    departmentsRepository.findByCode.mockResolvedValue(null);
    departmentsRepository.create.mockRejectedValue({
      code: "P2002",
      meta: { target: ["headId"] },
    });
    await expect(
      departmentsService.createDepartment({ code: "OPS", headId: "u1" }),
    ).rejects.toThrow(ConflictError);
  });

  test("headId tidak dikenal → NotFoundError", async () => {
    departmentsRepository.findById.mockResolvedValue({ id: "d1", code: "OPS" });
    departmentsRepository.update.mockRejectedValue({ code: "P2003" });
    await expect(
      departmentsService.updateDepartment("d1", { headId: "tidak-ada" }),
    ).rejects.toThrow(NotFoundError);
  });
});

describe("deleteDepartment", () => {
  test("id tidak ada → NotFoundError", async () => {
    departmentsRepository.findById.mockResolvedValue(null);
    await expect(departmentsService.deleteDepartment("x")).rejects.toThrow(
      NotFoundError,
    );
  });

  test("ada → panggil deleteById", async () => {
    departmentsRepository.findById.mockResolvedValue({ id: "d1" });
    await departmentsService.deleteDepartment("d1");
    expect(departmentsRepository.deleteById).toHaveBeenCalledWith("d1");
  });
});
