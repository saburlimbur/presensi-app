export const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "akses ditolak. khusus admin.",
    });
  }

  return next();
};
