import express from "express";

import faceController from "./face.controller.js";
import { upload } from "../../middleware/upload.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const faceRoutes = express.Router();

faceRoutes.post(
  "/faces/enroll",
  authMiddleware,
  upload.array("user_faces", 10),
  faceController.enrollFace,
);

faceRoutes.post(
  "/faces/recognize",
  authMiddleware,
  upload.single("attendance_photo"),
  faceController.recognizeFace,
);

faceRoutes.get(
  "/faces/my-embeddings",
  authMiddleware,
  faceController.getMyEmbeddings,
);

faceRoutes.delete("/faces/reset", authMiddleware, faceController.resetFace);

export default faceRoutes;
