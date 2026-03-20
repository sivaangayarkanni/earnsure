import pino from "pino";
import pinoHttp from "pino-http";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: { service: "earnsure-backend" },
});

const httpLogger = pinoHttp({ logger });

export { logger, httpLogger };
