import jwt from "jsonwebtoken";

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

const generateFaceToken = (userId) => {
  return jwt.sign({ userId, purpose: "face" }, process.env.JWT_SECRET, {
    expiresIn: "5m",
  });
};

const isValidFaceToken = (token, userId) => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.purpose === "face" && payload.userId === userId;
  } catch {
    return false;
  }
};

const stripPassword = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

export default {
  generateAccessToken,
  generateRefreshToken,
  generateFaceToken,
  isValidFaceToken,
  stripPassword,
};
