import { APP_MODE, dbHost } from "./src/config/loadEnv.js";
import { defineConfig, env } from "prisma/config";

console.log(`[prisma] NODE_ENV=${APP_MODE} → ${dbHost()}`);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node ./prisma/seed.js",
  },
  datasource: {
    url: env("DIRECT_URL") ?? env("DATABASE_URL"),
  },
});
