import multer from "multer";
import path from "path";
import os from "os";
import fs from "fs";
import crypto from "crypto";
import { BadRequestError } from "../utils/error.js";

const uploadDir = path.join(os.tmpdir(), "absensi-uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const imageTypes = ["image/jpeg", "image/png"];

const allowedTypes = {
  user_faces: imageTypes,
  attendance_photo: imageTypes,
  profile_photo: imageTypes,
  permission_attachment: [
    ...imageTypes,
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

export const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      cb(
        null,
        `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`,
      );
    },
  }),
  fileFilter: (req, file, cb) => {
    if (allowedTypes[file.fieldname]?.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new BadRequestError("format file tidak didukung."));
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
