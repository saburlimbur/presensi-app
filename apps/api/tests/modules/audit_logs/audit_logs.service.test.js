import auditLogsService from "../../../src/modules/audit_logs/audit_logs.service.js";
import auditLogsRepository from "../../../src/modules/audit_logs/audit_logs.repository.js";

vi.mock("../../../src/modules/audit_logs/audit_logs.repository.js", () => ({
  __esModule: true,
  default: { create: vi.fn(), findMany: vi.fn() },
}));
vi.mock("../../../src/utils/logger.js", () => ({
  __esModule: true,
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());

describe("log", () => {
  test("sukses → teruskan userId/action/details ke repository", async () => {
    auditLogsRepository.create.mockResolvedValue({ id: "a1" });
    await auditLogsService.log({ userId: "u1", action: "LOGIN", details: { ip: "1.1.1.1" } });
    expect(auditLogsRepository.create).toHaveBeenCalledWith({
      userId: "u1",
      action: "LOGIN",
      details: { ip: "1.1.1.1" },
    });
  });

  test("userId/details kosong → dinormalkan jadi null", async () => {
    auditLogsRepository.create.mockResolvedValue({ id: "a1" });
    await auditLogsService.log({ action: "SYSTEM" });
    expect(auditLogsRepository.create).toHaveBeenCalledWith({
      userId: null,
      action: "SYSTEM",
      details: null,
    });
  });

  test("repository error → tidak melempar, kembalikan null (audit non-blocking)", async () => {
    auditLogsRepository.create.mockRejectedValue(new Error("db down"));
    const result = await auditLogsService.log({ action: "LOGIN" });
    expect(result).toBeNull();
  });
});

describe("list", () => {
  test("skip + totalPage benar", async () => {
    auditLogsRepository.findMany.mockResolvedValue({ data: [], total: 45 });
    const result = await auditLogsService.list({ page: 2, limit: 20 });
    expect(auditLogsRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 }),
    );
    expect(result.pagination).toMatchObject({ total: 45, totalPages: 3 });
  });
});
