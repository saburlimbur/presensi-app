import tokens from "../../lib/tokens.js";
import { safeUnlink } from "../../utils/safe-unlink.js";

import faceService from "./face.service.js";
import logger from "../../utils/logger.js";
import { sendError, BadRequestError } from "../../utils/error.js";

const enrollFace = async (req, res) => {
  try {
    const userId = req.user.id;
    const files = req.files;

    if (!files || files.length === 0) {
      throw new BadRequestError("tidak ada file foto yang diupload.");
    }

    const result = await faceService.enrollFace(userId, files);

    if (result.enrolled === 0) {
      return res.status(400).json({
        success: false,
        message: "semua foto gagal diproses.",
        data: result,
      });
    }

    if (result.failed > 0) {
      return res.status(200).json({
        success: true,
        message: `berhasil mendaftarkan ${result.enrolled} foto wajah, ${result.failed} foto ditolak.`,
        data: result,
      });
    }

    return res.status(200).json({
      success: true,
      message: `berhasil mendaftarkan ${result.enrolled} foto wajah.`,
      data: result,
    });
  } catch (error) {
    logger.error(`Enroll Face Error: ${error.message}`);
    return sendError(res, error);
  }
};

const recognizeFace = async (req, res) => {
  try {
    const imageFile = req.file;

    if (!imageFile) {
      throw new BadRequestError("tidak ada file foto yang diupload.");
    }

    let match;
    try {
      match = await faceService.recognizeFace(imageFile.path);
    } finally {
      await safeUnlink(imageFile.path);
    }

    if (!match) {
      return res.status(404).json({
        success: false,
        message:
          "wajah tidak dikenali. pastikan anda sudah melakukan registrasi wajah.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "wajah berhasil dikenali.",
      data: {
        userId: match.userId,
        distance: match.distance,
        confidence: match.confidence,
        verificationToken:
          match.userId === req.user.id
            ? tokens.generateFaceToken(req.user.id)
            : undefined,
      },
    });
  } catch (error) {
    logger.error(`Recognize Face Error: ${error.message}`);
    return sendError(res, error);
  }
};

const getMyEmbeddings = async (req, res) => {
  try {
    const userId = req.user.id;
    const embeddings = await faceService.getEmbeddingsByUserId(userId);

    return res.status(200).json({
      success: true,
      message: "data embedding wajah berhasil diambil.",
      data: {
        total: embeddings.length,
        embeddings: embeddings.map((e) => ({
          id: e.id,
          imageUrl: e.imageUrl,
          imageUrl_url: e.imageUrl_url,
          createdAt: e.createdAt,
        })),
      },
    });
  } catch (error) {
    logger.error(`Get Embeddings Error: ${error.message}`);
    return sendError(res, error);
  }
};

const resetFace = async (req, res) => {
  try {
    const userId = req.user.id;
    await faceService.deleteUserEmbeddings(userId);

    return res.status(200).json({
      success: true,
      message:
        "semua data wajah berhasil dihapus. silakan lakukan enrollment ulang.",
    });
  } catch (error) {
    logger.error(`Reset Face Error: ${error.message}`);
    return sendError(res, error);
  }
};

export default { enrollFace, recognizeFace, getMyEmbeddings, resetFace };
