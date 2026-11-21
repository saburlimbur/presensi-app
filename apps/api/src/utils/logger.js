import winston from "winston";
import path from "path";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, json, errors } = winston.format;

const logDir = path.join(process.cwd(), "logs");

const logger = winston.createLogger({
  level: "info",
  silent: process.env.NODE_ENV === "test",
  format: combine(
    errors({
      stack: true,
    }),
    timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new DailyRotateFile({
      level: "info",
      filename: path.join(logDir, "combined-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "10m",
      maxFiles: "3d",
      zippedArchive: true,
    }),
    new DailyRotateFile({
      level: "error",
      filename: path.join(logDir, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "5m",
      maxFiles: "14d",
      zippedArchive: true,
    }),
  ],
});

export default logger;
