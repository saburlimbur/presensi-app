import leaveBalanceService from "../../../src/modules/leave-balances/leave-balance.service.js";
import leaveBalanceRepository from "../../../src/modules/leave-balances/leave-balance.repository.js";
import {
  LeaveBalanceNotFoundError,
  LeaveBalanceAlreadyExistsError,
} from "../../../src/modules/leave-balances/errors/leave-balance.error.js";
import { inJakarta } from "../../../src/utils/date.js";

vi.mock(
  "../../../src/modules/leave-balances/leave-balance.repository.js",
  () => ({
    __esModule: true,
    default: {
      findByUserAndYear: vi.fn(),
      findAll: vi.fn(),
      findManyByUser: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
    },
  }),
);

const thisYear = inJakarta(new Date()).year();

beforeEach(() => vi.clearAllMocks());

describe("createBalance", () => {
  test("remainingDays = annualQuota + carryOverDays, usedDays mulai 0", async () => {
    leaveBalanceRepository.create.mockResolvedValue({ id: 1 });
    await leaveBalanceService.createBalance({
      userId: "u1",
      year: 2026,
      annualQuota: 12,
      carryOverDays: 3,
    });
    const payload = leaveBalanceRepository.create.mock.calls[0][0];
    expect(payload.remainingDays).toBe(15);
    expect(payload.usedDays).toBe(0);
  });
});

describe("updateBalance", () => {
  test("tidak ditemukan → LeaveBalanceNotFoundError", async () => {
    leaveBalanceRepository.findById.mockResolvedValue(null);
    await expect(leaveBalanceService.updateBalance(1, {})).rejects.toThrow(
      LeaveBalanceNotFoundError,
    );
  });

  test("remainingDays diturunkan ulang dari quota + carry - usedDays", async () => {
    leaveBalanceRepository.findById.mockResolvedValue({
      id: 1,
      annualQuota: 12,
      carryOverDays: 0,
      usedDays: 4,
    });
    leaveBalanceRepository.update.mockResolvedValue({ id: 1 });

    await leaveBalanceService.updateBalance(1, { annualQuota: 20 });

    const payload = leaveBalanceRepository.update.mock.calls[0][1];
    expect(payload.annualQuota).toBe(20);
    expect(payload.remainingDays).toBe(16);
  });
});

describe("updateBalance di bawah cuti terpakai", () => {
  test("kuota baru < usedDays → ditolak, tidak menyimpan saldo negatif", async () => {
    leaveBalanceRepository.findById.mockResolvedValue({
      id: 1,
      annualQuota: 12,
      carryOverDays: 0,
      usedDays: 8,
    });
    await expect(
      leaveBalanceService.updateBalance(1, { annualQuota: 5 }),
    ).rejects.toThrow(/sudah terpakai/);
    expect(leaveBalanceRepository.update).not.toHaveBeenCalled();
  });
});

describe("initForUser", () => {
  test("sudah ada → kembalikan yang ada, tidak create", async () => {
    const existing = { id: 1, remainingDays: 12 };
    leaveBalanceRepository.findByUserAndYear.mockResolvedValue(existing);
    const result = await leaveBalanceService.initForUser("u1", 2026);
    expect(result).toBe(existing);
    expect(leaveBalanceRepository.create).not.toHaveBeenCalled();
  });

  test("belum ada → create dengan default quota 12", async () => {
    leaveBalanceRepository.findByUserAndYear.mockResolvedValue(null);
    leaveBalanceRepository.create.mockResolvedValue({ id: 2 });
    await leaveBalanceService.initForUser("u1", 2026);
    const payload = leaveBalanceRepository.create.mock.calls[0][0];
    expect(payload.annualQuota).toBe(12);
    expect(payload.remainingDays).toBe(12);
  });

  test("race: create kena P2002 (AlreadyExists) → ambil pemenang race", async () => {
    const winner = { id: 3, remainingDays: 12 };
    leaveBalanceRepository.findByUserAndYear
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(winner);
    leaveBalanceRepository.create.mockRejectedValue(
      new LeaveBalanceAlreadyExistsError(),
    );
    const result = await leaveBalanceService.initForUser("u1", 2026);
    expect(result).toBe(winner);
  });
});

describe("getMyBalance", () => {
  test("ada → kembalikan langsung", async () => {
    const bal = { id: 1, year: 2026, remainingDays: 10 };
    leaveBalanceRepository.findByUserAndYear.mockResolvedValue(bal);
    const result = await leaveBalanceService.getMyBalance("u1", 2026);
    expect(result).toBe(bal);
  });

  test("self-heal: tahun berjalan tanpa balance → auto-init", async () => {
    leaveBalanceRepository.findByUserAndYear.mockResolvedValue(null);
    const created = { id: 9, year: thisYear, remainingDays: 12 };
    leaveBalanceRepository.create.mockResolvedValue(created);
    const result = await leaveBalanceService.getMyBalance("u1");
    expect(result).toBe(created);
    expect(leaveBalanceRepository.create).toHaveBeenCalled();
  });

  test("tahun lampau tanpa balance → LeaveBalanceNotFoundError (tidak auto-init)", async () => {
    leaveBalanceRepository.findByUserAndYear.mockResolvedValue(null);
    await expect(leaveBalanceService.getMyBalance("u1", 2000)).rejects.toThrow(
      LeaveBalanceNotFoundError,
    );
    expect(leaveBalanceRepository.create).not.toHaveBeenCalled();
  });
});
