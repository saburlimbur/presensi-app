import AppError from "../../../utils/error.js";

export class AlreadyCheckedInError extends AppError {
  constructor() {
    super("user sudah check-in", "ALREADY_CHECKED_IN", 409);
  }
}

export class AlreadyCheckedOutError extends AppError {
  constructor() {
    super("user sudah check-out", "ALREADY_CHECKED_OUT", 409);
  }
}

export class NotCheckedInError extends AppError {
  constructor() {
    super("user belum check-in hari ini", "NOT_CHECKED_IN", 409);
  }
}

export class CheckOutWindowExpiredError extends AppError {
  constructor() {
    super(
      "sesi check-in sebelumnya sudah melewati batas waktu check-out. hubungi admin untuk koreksi.",
      "CHECKOUT_WINDOW_EXPIRED",
      409,
    );
  }
}
