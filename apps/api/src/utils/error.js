class AppError extends Error {
  constructor(message, code, statusCode) {
    super(message);

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;

    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} tidak ditemukan`, "NOT_FOUND", 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, "CONFLICT", 409);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad Request") {
    super(message, "BAD_REQUEST", 400);
  }
}

export class ValidationError extends AppError {
  constructor(message, detail) {
    super(message, "VALIDATION_ERROR", 400);
    this.detail = detail;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export const isUniqueViolation = (err, target) => {
  if (err?.code !== "P2002") return false;
  if (!target) return true;
  const meta = err?.meta?.target;
  if (Array.isArray(target)) {
    return Array.isArray(meta) && target.every((t) => meta.includes(t));
  }
  return meta === target || (Array.isArray(meta) && meta.includes(target));
};

export const sendError = (res, error) => {
  if (!(error instanceof AppError)) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }

  const body = {
    success: false,
    message: error.message,
    code: error.code,
  };
  if (error.detail) body.detail = error.detail;
  if (error.details) body.details = error.details;

  return res.status(error.statusCode).json(body);
};

export default AppError;
