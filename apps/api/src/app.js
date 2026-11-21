import express from "express";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import morganMiddleware from "./middleware/morgan.middleware.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import logger from "./utils/logger.js";
import { env } from "./config/env.js";
import router from "./routes/index.js";
import swaggerSpec from "./config/swagger.js";
import multer from "multer";
import AppError, { sendError } from "./utils/error.js";

const app = express();

app.set("trust proxy", env.app.trustProxy);

app.use(morganMiddleware);

app.get("/api-docs.json", (req, res) => {
  res.json(swaggerSpec);
});
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: `${env.app.name} API Docs`,
    swaggerOptions: { persistAuthorization: true },
  }),
);

const buildCorsOrigin = (originConfig) => {
  if (originConfig === "*" || originConfig === true) return true;

  const list = Array.isArray(originConfig) ? originConfig : [originConfig];
  const matchers = list.map((o) => {
    if (typeof o === "string" && o.includes("*")) {
      const escaped = o
        .replace(/[.+?^${}()|[\]\\/]/g, "\\$&")
        .replace(/\*/g, ".*");
      return new RegExp(`^${escaped}$`);
    }
    return o;
  });

  return (origin, callback) => {
    if (!origin) return callback(null, true);
    const ok = matchers.some((m) =>
      m instanceof RegExp ? m.test(origin) : m === origin,
    );
    if (ok) return callback(null, true);
    return callback(new AppError("origin tidak diizinkan", "CORS_FORBIDDEN", 403));
  };
};

app.use(
  cors({
    origin: buildCorsOrigin(env.cors.origin),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
    exposedHeaders: ["Content-Disposition"],
    credentials: true,
  }),
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

app.use("/images", express.static("public/images"));
app.use("/files", express.static("public/files"));

app.get("/", (req, res) => {
  logger.info("Health check endpoint accessed");

  res.status(200).json({
    status: "success",
    message: "API is running successfully.",
    environment: env.app.env,
  });
});

app.use("/attendance_api", apiLimiter);

router(app);

app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "resource yang diminta tidak ditemukan.",
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `upload gagal: ${err.message}`,
      code: err.code,
    });
  }

  if (!(err instanceof AppError)) {
    logger.error("Unhandled error", {
      message: err.message,
      stack: err.stack,
      path: req.originalUrl.split("?")[0],
      method: req.method,
    });
  }

  return sendError(res, err);
});

export default app;
