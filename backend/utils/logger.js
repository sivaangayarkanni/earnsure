const winston = require("winston");
const { env } = require("../config/env");

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const prettyFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

const logger = winston.createLogger({
  level: env.logLevel,
  defaultMeta: { service: "earnsure-backend", env: env.nodeEnv },
  transports: [
    new winston.transports.Console({
      format: env.nodeEnv === "production" ? jsonFormat : prettyFormat,
    }),
  ],
});

module.exports = { logger };

