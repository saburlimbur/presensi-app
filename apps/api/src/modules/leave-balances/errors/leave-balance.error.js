import AppError from "../../../utils/error.js";

export class LeaveBalanceNotFoundError extends AppError {
  constructor(year) {
    super(
      year
        ? `saldo cuti tahun ${year} tidak ditemukan`
        : "saldo cuti tidak ditemukan",
      "LEAVE_BALANCE_NOT_FOUND",
      404,
    );
  }
}

export class LeaveBalanceAlreadyExistsError extends AppError {
  constructor(userId, year) {
    super(
      `saldo cuti untuk karyawan tahun ${year} sudah ada`,
      "LEAVE_BALANCE_ALREADY_EXISTS",
      409,
    );
    this.details = { userId, year };
  }
}

export class InsufficientLeaveBalanceError extends AppError {
  constructor({ remaining, requested, year }) {
    super(
      `saldo cuti tidak cukup. tersisa ${remaining} hari, dibutuhkan ${requested} hari (tahun ${year}).`,
      "INSUFFICIENT_LEAVE_BALANCE",
      409,
    );
    this.details = { remaining, requested, year };
  }
}
