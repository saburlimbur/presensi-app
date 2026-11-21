import fs from "fs";
import dotenv from "dotenv";

export const APP_MODE = process.env.NODE_ENV || "development";

const envFiles = [
  `.env.${APP_MODE}.local`,
  `.env.${APP_MODE}`,
  ".env",
].filter((f) => fs.existsSync(f));

dotenv.config({ path: envFiles, quiet: APP_MODE === "test" });

if (!process.env.DATABASE_URL) {
  throw new Error(
    `DATABASE_URL kosong untuk NODE_ENV=${APP_MODE}.\n` +
      `File yang terbaca: ${envFiles.join(", ") || "(tidak ada)"}\n` +
      `Isi DATABASE_URL di .env.${APP_MODE} — jangan taruh di .env, ` +
      `supaya tidak bocor lintas mode.`,
  );
}

export function dbHost() {
  try {
    return new URL(process.env.DATABASE_URL).host;
  } catch {
    return "(DATABASE_URL tidak valid)";
  }
}
