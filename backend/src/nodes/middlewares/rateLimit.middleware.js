const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const redisClient = require("../config/redis");
const { ApiResponse } = require("../utils/apiResponse");
const logger = require("../utils/logger");

/**
 * Builds a rate limiter backed by Redis (falls back to memory if Redis is down).
 */
const buildLimiter = ({ windowMs, max, keyPrefix, message }) => {
  const options = {
    windowMs,
    max,
    standardHeaders: true,   // Return RateLimit-* headers
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Prefer authenticated user ID so limits are per-user, not per-IP behind proxies
      return req.user?.id ? `${keyPrefix}:user:${req.user.id}` : `${keyPrefix}:ip:${req.ip}`;
    },
    handler: (req, res) => {
      logger.warn(`Rate limit hit — key: ${req.user?.id || req.ip}, route: ${req.originalUrl}`);
      return res
        .status(429)
        .json(ApiResponse.error(message || "Too many requests. Please slow down.", 429));
    },
  };

  // Attach Redis store only when client is ready
  if (redisClient?.status === "ready" || redisClient?.isOpen) {
    options.store = new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: keyPrefix,
    });
  }

  return rateLimit(options);
};

// ─── Preset limiters ────────────────────────────────────────────────

/** Strict limiter for auth routes (login, signup) */
const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyPrefix: "rl:auth",
  message: "Too many auth attempts. Please try again in 15 minutes.",
});

/** General API limiter for authenticated users */
const apiLimiter = buildLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  keyPrefix: "rl:api",
  message: "API rate limit exceeded. Max 100 requests per minute.",
});

/** Tight limiter for workflow execution endpoint */
const executionLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: 20,
  keyPrefix: "rl:exec",
  message: "Execution rate limit exceeded. Max 20 runs per minute.",
});

/** Webhook ingest limiter (public, IP-keyed) */
const webhookLimiter = buildLimiter({
  windowMs: 60 * 1000,
  max: 60,
  keyPrefix: "rl:webhook",
  message: "Webhook rate limit exceeded.",
});

module.exports = { authLimiter, apiLimiter, executionLimiter, webhookLimiter };