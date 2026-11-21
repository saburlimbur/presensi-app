import { sendError, NotFoundError } from "../../src/utils/error.js";

const mockRes = () => {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};

describe("sendError", () => {
  test("AppError → status, message, dan code diteruskan", () => {
    const res = mockRes();
    sendError(res, new NotFoundError("user"));
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "user tidak ditemukan",
      code: "NOT_FOUND",
    });
  });

  test("error non-AppError → 500 tanpa membocorkan pesan asli", () => {
    const res = mockRes();
    sendError(res, new Error('Invalid `prisma.user.findMany()` invocation'));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal Server Error",
    });
  });
});
