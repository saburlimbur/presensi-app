import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.js"],
    // Nilai tetap supaya test tidak bergantung pada file .env di mesin
    // masing-masing. Tanpa ini CORS_ORIGIN kosong berarti "*" dan test
    // penolakan origin gagal di CI.
    env: {
      CORS_ORIGIN: "http://localhost:*",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
      all: true,
      include: ["src/**/*.js"],
      exclude: [
        "src/server.js",
        "src/config/**",
        "src/docs/**",
        "**/*.docs.js",
        "**/*.routes.js",
        "**/*.worker.js",
        "prisma/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
