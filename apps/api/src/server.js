import app from "./app.js";
import { env } from "./config/env.js";
import logger from "./utils/logger.js";
import facePool from "./modules/faces/face-pool.js";

let server;

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", {
    message: err?.message,
    stack: err?.stack,
  });

  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", {
    message: reason?.message || reason,
    stack: reason?.stack,
  });

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

const startServer = async () => {
  try {
    facePool.init();

    server = app.listen(env.app.port, () => {
      logger.info(`SERVER RUNNING ON PORT: ${env.app.port}`);
    });

    const shutdown = (signal) => {
      logger.warn(`${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        await facePool.shutdown();
        logger.info("Server closed successfully");
        process.exit(0);
      });

      setTimeout(() => {
        logger.error("Force shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (err) {
    logger.error("Failed to start server", {
      message: err?.message,
      stack: err?.stack,
    });

    process.exit(1);
  }
};

startServer();
