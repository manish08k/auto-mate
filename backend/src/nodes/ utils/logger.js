const { createLogger, format, transports } = require("winston");
const path = require("path");

const { combine, timestamp, printf, colorize, errors, json, splat } = format;

const NODE_ENV  = process.env.NODE_ENV  || "development";
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === "production" ? "info" : "debug");
const LOG_DIR   = process.env.LOG_DIR   || "logs";

// ─── Custom Console Format (dev) ──────────────────────────────────

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  splat(),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? "\n" + JSON.stringify(meta, null, 2)
      : "";
    return `${timestamp} [${level}] ${stack || message}${metaStr}`;
  })
);

// ─── JSON Format (production / log files) ─────────────────────────

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  splat(),
  json()
);

// ─── Transports ───────────────────────────────────────────────────

const activeTransports = [
  new transports.Console({
    format: NODE_ENV === "production" ? prodFormat : devFormat,
  }),
];

// Write to rotating files in production
if (NODE_ENV === "production") {
  // Combined log — all levels
  activeTransports.push(
    new transports.File({
      filename: path.join(LOG_DIR, "combined.log"),
      format:   prodFormat,
      maxsize:  10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
      tailable: true,
    })
  );

  // Error-only log
  activeTransports.push(
    new transports.File({
      level:    "error",
      filename: path.join(LOG_DIR, "error.log"),
      format:   prodFormat,
      maxsize:  10 * 1024 * 1024,
      maxFiles: 10,
      tailable: true,
    })
  );
}

// ─── Logger Instance ──────────────────────────────────────────────

const logger = createLogger({
  level:       LOG_LEVEL,
  transports:  activeTransports,
  exitOnError: false,
  silent:      process.env.NODE_ENV === "test", // suppress during unit tests
});

// ─── Request Logger Middleware ────────────────────────────────────

/**
 * Express middleware — logs method, url, status, and duration.
 * Mount early in app.js: app.use(logger.requestMiddleware)
 */
logger.requestMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const level    = res.statusCode >= 500 ? "error"
                   : res.statusCode >= 400 ? "warn"
                   : "http";

    // Skip noisy health-check pings
    if (req.path === "/health" || req.path === "/ping") return;

    logger.log(level, `${req.method} ${req.originalUrl} ${res.statusCode} — ${duration}ms`, {
      method:     req.method,
      url:        req.originalUrl,
      status:     res.statusCode,
      duration_ms: duration,
      ip:         req.ip,
      user_id:    req.user?.id ?? null,
    });
  });

  next();
};

// ─── Stream for Morgan (optional) ─────────────────────────────────

logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
