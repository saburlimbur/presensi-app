import fsp from "fs/promises";
import logger from "./logger.js";

export const safeUnlink = async (filePath) => {
  try {
    await fsp.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      logger.warn(`failed to unlink ${filePath}: ${err.message}`);
    }
  }
};
