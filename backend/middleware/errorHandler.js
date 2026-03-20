const { logger } = require("../utils/logger");

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const payload = {
    error: statusCode >= 500 ? "internal_error" : "request_error",
    message: err.message || "Unexpected error",
  };

  if (err.details) {
    payload.details = err.details;
  }

  logger.error("request_failed", {
    statusCode,
    message: err.message,
    details: err.details,
  });

  res.status(statusCode).json(payload);
}

module.exports = { errorHandler };

