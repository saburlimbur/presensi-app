import morgan from "morgan"
import logger from "../utils/logger.js";

const morganMiddleware = morgan(
  (tokens, req, res) => {
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res).replace(/([?&]token=)[^&]+/, "$1[redacted]"),
      status: Number(tokens.status(req, res)),
      responseTime: `${tokens["response-time"](req, res)}ms`,
    });
  },
  {
    stream: {
      write: (message) => {
        const data = JSON.parse(message);
        logger.info("HTTP Request", data);
      },
    },
  },
);

export default morganMiddleware