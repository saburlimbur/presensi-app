import userService from "../../../src/modules/users/user.service.js";
import userRepository from "../../../src/modules/users/user.repository.js";
import bcrypt from "bcrypt";
import {
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  BadRequestError,
} from "../../../src/utils/error.js";
import {
  EmailAlreadyExistsError,
  DepartmentNotFoundError,
} from "../../../src/modules/users/errors/user.error.js";

vi.mock("../../../src/modules/users/user.repository.js", () => ({
  __esModule: true,
  default: {
    countByRole: vi.fn(),
    isEmailExist: vi.fn(),
    create: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
    findDetailById: vi.fn(),
    findDepartmentByCode: vi.fn(),
    findLastEmployeeId: vi.fn(),
    createRefreshToken: vi.fn(),
    update: vi.fn(),
    findAll: vi.fn(),
    deleteAllRefreshTokens: vi.fn(),
  },
}));
vi.mock("bcrypt", () => ({
  __esModule: true,
  default: { hash: vi.fn(async () => "hashed"), compare: vi.fn() },
}));
vi.mock("../../../src/lib/tokens.js", () => ({
  __esModule: true,
  default: {
    stripPassword: (u) => {
      const { password, ...rest } = u;
      return rest;
    },
    generateAccessToken: vi.fn(() => "access-token"),
    generateRefreshToken: vi.fn(() => "refresh-token"),
  },
}));
vi.mock("../../../src/modules/leave-balances/leave-balance.service.js", () => ({
  __esModule: true,
  default: { initForUser: vi.fn() },
}));
vi.mock("../../../src/utils/logger.js", () => ({
  __esModule: true,
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());

describe("registerAdmin", () => {
  test("sudah ada admin → ConflictError", async () => {
    userRepository.countByRole.mockResolvedValue(1);
    await expect(
      userService.registerAdmin({ email: "a@a.com", password: "x" }),
    ).rejects.toThrow(ConflictError);
  });

  test("email sudah dipakai → EmailAlreadyExistsError", async () => {
    userRepository.countByRole.mockResolvedValue(0);
    userRepository.isEmailExist.mockResolvedValue(1);
    await expect(
      userService.registerAdmin({ email: "a@a.com", password: "x" }),
    ).rejects.toThrow(EmailAlreadyExistsError);
  });

  test("sukses → buat ADM-001 role ADMIN & buang password dari hasil", async () => {
    userRepository.countByRole.mockResolvedValue(0);
    userRepository.isEmailExist.mockResolvedValue(0);
    userRepository.create.mockResolvedValue({
      id: "u1",
      email: "a@a.com",
      password: "hashed",
      role: "ADMIN",
    });
    const result = await userService.registerAdmin({
      email: "a@a.com",
      password: "secret",
      fullName: "Admin",
    });
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: "ADM-001", role: "ADMIN" }),
    );
    expect(result).not.toHaveProperty("password");
  });
});

describe("createUser", () => {
  test("email sudah dipakai → EmailAlreadyExistsError", async () => {
    userRepository.isEmailExist.mockResolvedValue(1);
    await expect(
      userService.createUser({ email: "a@a.com", password: "x", departmentCode: "IT" }),
    ).rejects.toThrow(EmailAlreadyExistsError);
  });

  test("department tidak ditemukan → DepartmentNotFoundError", async () => {
    userRepository.isEmailExist.mockResolvedValue(0);
    userRepository.findDepartmentByCode.mockResolvedValue(null);
    await expect(
      userService.createUser({ email: "a@a.com", password: "x", departmentCode: "NOPE" }),
    ).rejects.toThrow(DepartmentNotFoundError);
  });

  test("sukses → generate EMP-001, resolve departmentId, buang password", async () => {
    userRepository.isEmailExist.mockResolvedValue(0);
    userRepository.findDepartmentByCode.mockResolvedValue({ id: "d1" });
    userRepository.findLastEmployeeId.mockResolvedValue(null);
    userRepository.create.mockResolvedValue({
      id: "u2",
      email: "a@a.com",
      password: "hashed",
    });
    const result = await userService.createUser({
      email: "a@a.com",
      password: "secret",
      fullName: "Budi",
      departmentCode: "IT",
    });
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ employeeId: "EMP-001", departmentId: "d1" }),
    );
    expect(result).not.toHaveProperty("password");
  });
});

describe("loginUser", () => {
  test("email tidak ada → UnauthorizedError", async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    await expect(
      userService.loginUser({ email: "a@a.com", password: "x" }),
    ).rejects.toThrow(UnauthorizedError);
  });

  test("akun non-aktif → UnauthorizedError", async () => {
    userRepository.findByEmail.mockResolvedValue({ id: "u1", isActive: false });
    await expect(
      userService.loginUser({ email: "a@a.com", password: "x" }),
    ).rejects.toThrow(UnauthorizedError);
  });

  test("password salah → UnauthorizedError", async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: "u1",
      isActive: true,
      password: "hashed",
    });
    bcrypt.compare.mockResolvedValue(false);
    await expect(
      userService.loginUser({ email: "a@a.com", password: "wrong" }),
    ).rejects.toThrow(UnauthorizedError);
  });

  test("sukses → kembalikan access & refresh token + simpan refresh token", async () => {
    userRepository.findByEmail.mockResolvedValue({
      id: "u1",
      isActive: true,
      password: "hashed",
      isFaceRegistered: true,
    });
    bcrypt.compare.mockResolvedValue(true);
    const result = await userService.loginUser({
      email: "a@a.com",
      password: "secret",
    });
    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(result.user).not.toHaveProperty("password");
    expect(userRepository.createRefreshToken).toHaveBeenCalled();
  });
});

describe("getUserById / toggleActiveUser", () => {
  test("getUserById tidak ada → NotFoundError", async () => {
    userRepository.findDetailById.mockResolvedValue(null);
    await expect(userService.getUserById("x")).rejects.toThrow(NotFoundError);
  });

  test("toggleActiveUser membalik isActive", async () => {
    userRepository.findById.mockResolvedValue({ id: "u1", isActive: true });
    await userService.toggleActiveUser("u1");
    expect(userRepository.update).toHaveBeenCalledWith("u1", { isActive: false });
  });
});

describe("adminUpdateUser", () => {
  test("user tidak ada → NotFoundError", async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(userService.adminUpdateUser("x", {})).rejects.toThrow(
      NotFoundError,
    );
  });

  test("email baru dipakai user lain → EmailAlreadyExistsError", async () => {
    userRepository.findById.mockResolvedValue({ id: "u1", email: "old@a.com" });
    userRepository.findByEmail.mockResolvedValue({ id: "u2", email: "new@a.com" });
    await expect(
      userService.adminUpdateUser("u1", { email: "new@a.com" }),
    ).rejects.toThrow(EmailAlreadyExistsError);
  });

  test("departmentCode tidak ada → DepartmentNotFoundError", async () => {
    userRepository.findById.mockResolvedValue({ id: "u1", email: "old@a.com" });
    userRepository.findDepartmentByCode.mockResolvedValue(null);
    await expect(
      userService.adminUpdateUser("u1", { departmentCode: "NOPE" }),
    ).rejects.toThrow(DepartmentNotFoundError);
  });
});

describe("proteksi akun sendiri & pencabutan refresh token", () => {
  test("toggleActiveUser pada diri sendiri → BadRequestError", async () => {
    await expect(userService.toggleActiveUser("u1", "u1")).rejects.toThrow(
      BadRequestError,
    );
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  test("adminUpdateUser menurunkan role sendiri → BadRequestError", async () => {
    userRepository.findById.mockResolvedValue({ id: "u1", email: "a@a.com" });
    await expect(
      userService.adminUpdateUser("u1", { role: "EMPLOYEE" }, "u1"),
    ).rejects.toThrow(BadRequestError);
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  test("adminUpdateUser ganti password → refresh token dicabut", async () => {
    userRepository.findById.mockResolvedValue({ id: "u2", email: "b@b.com" });
    await userService.adminUpdateUser("u2", { password: "baru123" }, "u1");
    expect(userRepository.deleteAllRefreshTokens).toHaveBeenCalledWith("u2");
  });

  test("updatePassword → refresh token dicabut", async () => {
    userRepository.findById.mockResolvedValue({ id: "u1", password: "hashed" });
    bcrypt.compare.mockResolvedValue(true);
    await userService.updatePassword("u1", "lama", "baru123");
    expect(userRepository.deleteAllRefreshTokens).toHaveBeenCalledWith("u1");
  });
});

describe("getAllUsers", () => {
  test("hitung skip + totalPages", async () => {
    userRepository.findAll.mockResolvedValue({ data: [], total: 21 });
    const result = await userService.getAllUsers({ page: 3, limit: 10 });
    expect(userRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
    expect(result.pagination).toMatchObject({ total: 21, totalPages: 3 });
  });
});
