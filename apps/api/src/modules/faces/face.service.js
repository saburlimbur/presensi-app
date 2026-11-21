import { safeUnlink } from "../../utils/safe-unlink.js";
import fsp from "fs/promises";
import prisma from "../../lib/prisma.js";
import facePool from "./face-pool.js";
import faceRepository from "./face.repository.js";
import logger from "../../utils/logger.js";
import { env } from "../../config/env.js";
import {
  uploadObject,
  removeObject,
  createSignedUrls,
} from "../../lib/storage.js";
import { BadRequestError, ConflictError } from "../../utils/error.js";

let embeddingCache = null;
let cacheTimestamp = 0;

const getAllEmbeddingsWithCache = async () => {
  const now = Date.now();

  if (embeddingCache && now - cacheTimestamp < 5 * 60 * 1000) {
    return embeddingCache;
  }

  embeddingCache = await faceRepository.findAll();
  cacheTimestamp = now;

  logger.info(
    `Embedding cache refreshed: ${embeddingCache.length} embeddings loaded`,
  );
  return embeddingCache;
};

const invalidateCache = () => {
  embeddingCache = null;
  cacheTimestamp = 0;
};

const generateEmbedding = async (imagePath) => {
  try {
    return await facePool.embed(imagePath);
  } catch (err) {
    if (err.code === "NO_FACE") {
      throw new BadRequestError(
        "wajah tidak terdeteksi. pastikan pencahayaan cukup dan wajah menghadap kamera.",
      );
    }
    if (err.code === "MULTI_FACE") {
      throw new BadRequestError(
        "terdeteksi lebih dari 1 wajah. pastikan hanya ada 1 orang dalam foto.",
      );
    }
    throw err;
  }
};

const RECOGNITION_THRESHOLD = 0.5;

const euclideanDistance = (a, b) => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
};

const MAX_EMBEDDINGS_PER_USER = 10;
const MIN_EMBEDDINGS_REQUIRED = 3;

const syncFaceRegisteredFlag = async (tx, userId) => {
  const count = await tx.faceEmbedding.count({ where: { userId } });
  await tx.user.update({
    where: { id: userId },
    data: { isFaceRegistered: count > 0 },
  });
};

const signEmbeddings = async (embeddings) => {
  const keyed = embeddings.filter((e) => e?.imageUrl);
  if (keyed.length === 0) return embeddings;

  let urlMap = new Map();

  try {
    urlMap = await createSignedUrls(
      env.supabase.bucketFaces,
      keyed.map((e) => e.imageUrl),
      3600,
    );
  } catch (err) {
    logger.warn(`batch sign face image gagal: ${err.message}`);
  }

  for (const e of keyed) {
    e.imageUrl_url = urlMap.get(e.imageUrl) ?? null;
  }

  return embeddings;
};

const isDuplicate = (newEmb, embeddingList) => {
  for (const existing of embeddingList) {
    const emb = existing.embedding || existing;
    const dist = euclideanDistance(newEmb, emb);
    if (dist < 0.15) return true;
  }
  return false;
};

const enrollFace = async (userId, files) => {
  if (!files || files.length < MIN_EMBEDDINGS_REQUIRED) {
    await Promise.all((files ?? []).map((f) => safeUnlink(f.path)));
    throw new BadRequestError(
      `minimal ${MIN_EMBEDDINGS_REQUIRED} foto wajah diperlukan untuk enrollment.`,
    );
  }

  const existingCount = await faceRepository.countByUserId(userId);
  if (existingCount + files.length > MAX_EMBEDDINGS_PER_USER) {
    await Promise.all(files.map((f) => safeUnlink(f.path)));
    throw new ConflictError(
      `maksimal ${MAX_EMBEDDINGS_PER_USER} foto per user. saat ini sudah ada ${existingCount} foto.`,
    );
  }

  const existingEmbeddings = await faceRepository.findByUserId(userId);

  const validated = [];
  const errors = [];

  for (const file of files) {
    try {
      const embedding = await generateEmbedding(file.path);

      if (isDuplicate(embedding, existingEmbeddings)) {
        await safeUnlink(file.path);
        errors.push({
          fileName: file.filename,
          status: "failed",
          message:
            "foto terlalu mirip dengan foto yang sudah terdaftar sebelumnya.",
        });
        continue;
      }

      if (
        isDuplicate(
          embedding,
          validated.map((v) => v.embedding),
        )
      ) {
        await safeUnlink(file.path);
        errors.push({
          fileName: file.filename,
          status: "failed",
          message:
            "foto terlalu mirip dengan foto lain dalam upload yang sama.",
        });
        continue;
      }

      validated.push({ file, embedding });
    } catch (err) {
      await safeUnlink(file.path);
      errors.push({
        fileName: file.filename,
        status: "failed",
        message: err.message,
      });
    }
  }

  if (validated.length === 0) {
    return {
      enrolled: 0,
      failed: errors.length,
      total: existingCount,
      results: [],
      errors,
    };
  }

  const uploadedKeys = [];
  try {
    for (const v of validated) {
      const key = `users/${v.file.filename}`;
      const buffer = await fsp.readFile(v.file.path);
      await uploadObject(env.supabase.bucketFaces, key, buffer, v.file.mimetype);
      uploadedKeys.push(key);
      v.imageKey = key;
    }
  } catch (err) {
    await Promise.all([
      ...validated.map((v) => safeUnlink(v.file.path)),
      ...uploadedKeys.map((k) =>
        removeObject(env.supabase.bucketFaces, k).catch(() => {}),
      ),
    ]);
    logger.error(`Supabase upload gagal saat enrollment: ${err.message}`);
    throw err;
  }

  let results;
  try {
    results = await prisma.$transaction(async (tx) => {
      const currentCount = await tx.faceEmbedding.count({ where: { userId } });
      if (currentCount + validated.length > MAX_EMBEDDINGS_PER_USER) {
        throw new ConflictError(
          `maksimal ${MAX_EMBEDDINGS_PER_USER} foto per user. saat ini sudah ada ${currentCount} foto.`,
        );
      }

      const inserted = [];
      for (const v of validated) {
        const saved = await tx.faceEmbedding.create({
          data: {
            userId,
            embedding: v.embedding,
            imageUrl: v.imageKey,
          },
        });
        inserted.push({
          id: saved.id,
          fileName: v.file.filename,
          status: "success",
        });
      }

      await syncFaceRegisteredFlag(tx, userId);

      return inserted;
    });
  } catch (err) {
    await Promise.all([
      ...validated.map((v) => safeUnlink(v.file.path)),
      ...uploadedKeys.map((k) =>
        removeObject(env.supabase.bucketFaces, k).catch(() => {}),
      ),
    ]);
    throw err;
  }

  await Promise.all(validated.map((v) => safeUnlink(v.file.path)));

  if (results.length > 0) {
    invalidateCache();
  }

  return {
    enrolled: results.length,
    failed: errors.length,
    total: existingCount + results.length,
    results,
    errors,
  };
};

const recognizeFace = async (imagePath) => {
  const inputEmbedding = await generateEmbedding(imagePath);
  const allEmbeddings = await getAllEmbeddingsWithCache();

  if (allEmbeddings.length === 0) {
    throw new BadRequestError("belum ada data wajah terdaftar dalam sistem.");
  }

  const bestPerUser = new Map();
  for (const record of allEmbeddings) {
    const dist = euclideanDistance(inputEmbedding, record.embedding);
    const prev = bestPerUser.get(record.userId);
    if (prev === undefined || dist < prev) {
      bestPerUser.set(record.userId, dist);
    }
  }

  const ranked = [...bestPerUser.entries()].sort((a, b) => a[1] - b[1]);
  const [bestUserId, bestDistance] = ranked[0];

  if (bestDistance > RECOGNITION_THRESHOLD) {
    return null;
  }

  if (ranked.length > 1) {
    const secondDistance = ranked[1][1];
    if (secondDistance - bestDistance < 0.05) {
      logger.warn(
        `recognize ambigu: best=${bestDistance.toFixed(3)} (user ${bestUserId}) vs runner-up=${secondDistance.toFixed(3)} (user ${ranked[1][0]}) — ditolak`,
      );
      return null;
    }
  }

  return {
    userId: bestUserId,
    distance: bestDistance,
    confidence: Math.round((1 - bestDistance / RECOGNITION_THRESHOLD) * 100),
  };
};

const getEmbeddingsByUserId = async (userId) => {
  return await signEmbeddings(await faceRepository.findByUserId(userId));
};

const deleteUserEmbeddings = async (userId) => {
  const existing = await faceRepository.findByUserId(userId);

  await prisma.$transaction(async (tx) => {
    await tx.faceEmbedding.deleteMany({ where: { userId } });
    await syncFaceRegisteredFlag(tx, userId);
  });
  invalidateCache();

  await Promise.all(
    existing
      .filter((e) => e.imageUrl)
      .map((e) =>
        removeObject(env.supabase.bucketFaces, e.imageUrl).catch((err) =>
          logger.warn(
            `failed to remove face object ${e.imageUrl}: ${err.message}`,
          ),
        ),
      ),
  );
};

export default {
  generateEmbedding,
  enrollFace,
  recognizeFace,
  getEmbeddingsByUserId,
  deleteUserEmbeddings,
  invalidateCache,
  signEmbeddings,
};
