import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

// Face token yang sudah dipakai, jti → waktu kedaluwarsa (ms).
// Disimpan di memori proses: cukup selama API jalan sebagai satu instance.
// Kalau nanti di-scale ke beberapa instance, pindahkan ke Redis atau database.
const usedFaceTokens = new Map();

const pruneUsedFaceTokens = (now = Date.now()) => {
  for (const [jti, expiresAt] of usedFaceTokens) {
    if (expiresAt <= now) usedFaceTokens.delete(jti);
  }
};

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
    jwtid: randomUUID(),
  });
};

const verifyFaceToken = (token, userId) => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const valid =
      payload.purpose === "face" && payload.userId === userId && payload.jti;
    return valid ? payload : null;
  } catch {
    return null;
  }
};

const isValidFaceToken = (token, userId) => {
  const payload = verifyFaceToken(token, userId);
  return Boolean(payload) && !usedFaceTokens.has(payload.jti);
};

// Tandai token sebagai terpakai. Mengembalikan id token, atau null kalau token
// tidak sah atau sudah pernah dipakai.
const consumeFaceToken = (token, userId) => {
  const payload = verifyFaceToken(token, userId);
  if (!payload) return null;

  pruneUsedFaceTokens();
  if (usedFaceTokens.has(payload.jti)) return null;

  usedFaceTokens.set(payload.jti, payload.exp * 1000);
  return payload.jti;
};

// Batalkan pemakaian, dipanggil kalau aksi yang memakai token gagal sehingga
// user tidak perlu verifikasi wajah ulang hanya karena, misalnya, di luar radius.
const releaseFaceToken = (tokenId) => {
  usedFaceTokens.delete(tokenId);
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
  consumeFaceToken,
  releaseFaceToken,
  stripPassword,
};
