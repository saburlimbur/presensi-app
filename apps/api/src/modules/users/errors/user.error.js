import AppError from "../../../utils/error.js";

export class EmailAlreadyExistsError extends AppError {
  constructor() {
    super("email sudah terdaftar", "EMAIL_ALREADY_EXISTS", 409);
  }
}

export class DepartmentNotFoundError extends AppError {
  constructor(code) {
    super(
      `department dengan kode "${code}" tidak ditemukan`,
      "DEPARTMENT_NOT_FOUND",
      404,
    );
  }
}

export class EmployeeIdAllocationError extends AppError {
  constructor() {
    super(
      "gagal mengalokasikan id karyawan, silakan coba lagi.",
      "EMPLOYEE_ID_ALLOCATION_FAILED",
      503,
    );
  }
}

export class InvalidResetTokenError extends AppError {
  constructor() {
    super(
      "token reset tidak valid atau sudah kedaluwarsa",
      "INVALID_RESET_TOKEN",
      400,
    );
  }
}
