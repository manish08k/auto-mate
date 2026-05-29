const logger = require("../utils/logger");
const { ApiResponse } = require("../utils/apiResponse");

/**
 * 404 handler — mount AFTER all routes.
 */
const notFoundHandler = (req, res, _next) => {
  logger.warn(`404 — ${req.method} ${req.originalUrl}`);
  return res
    .status(404)
    .json(ApiResponse.error(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

/**
 * Global error handler — must have 4 params so Express recognises it.
 * Mount LAST in app.js after all routes and other middleware.
 */
const globalErrorHandler = (err, req, res, _next) => {
  // Sequelize / Prisma validation errors
  if (err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError") {
    const messages = err.errors?.map((e) => e.message) ?? [err.message];
    logger.warn(`Validation error on ${req.originalUrl}: ${messages.join(", ")}`);
    return res.status(422).json(ApiResponse.error(messages.join(", "), 422));
  }

  // JWT errors bubbled up without being caught in auth middleware
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json(ApiResponse.error("Invalid or expired token", 401));
  }

  // Payload too large (express body-parser limit)
  if (err.type === "entity.too.large") {
    return res.status(413).json(ApiResponse.error("Request payload too large", 413));
  }

  // Operational / known errors thrown intentionally with a statusCode
  if (err.statusCode) {
    logger.warn(`Operational error [${err.statusCode}]: ${err.message}`);
    return res.status(err.statusCode).json(ApiResponse.error(err.message, err.statusCode));
  }

  // Unknown / unexpected errors
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, {
    message: err.message,
    stack: err.stack,
  });

  const isProd = process.env.NODE_ENV === "production";

  return res.status(500).json(
    ApiResponse.error(
      isProd ? "An unexpected error occurred. Please try again." : err.message,
      500,
      isProd ? undefined : { stack: err.stack }
    )
  );
};

module.exports = { notFoundHandler, globalErrorHandler };