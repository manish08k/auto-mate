const { createClient } = require("redis");
const logger = require("../utils/logger");

const {
  REDIS_HOST     = "localhost",
  REDIS_PORT     = 6379,
  REDIS_PASSWORD = "",
  REDIS_DB       = 0,
} = process.env;

// ─── Primary Redis client (used by rate-limiter, cache, pub/sub) ───

const redisClient = createClient({
  socket: {
    host:           REDIS_HOST,
    port:           Number(REDIS_PORT),
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error("Redis: max reconnect attempts reached");
        return new Error("Max retries reached");
      }
      const delay = Math.min(retries * 100, 3000);
      logger.warn(`Redis: reconnecting in ${delay}ms (attempt ${retries})`);
      return delay;
    },
  },
  password: REDIS_PASSWORD || undefined,
  database: Number(REDIS_DB),
});

redisClient.on("connect",   ()    => logger.info("Redis connected"));
redisClient.on("ready",     ()    => logger.info("Redis ready"));
redisClient.on("error",     (err) => logger.error(`Redis error: ${err.message}`));
redisClient.on("end",       ()    => logger.warn("Redis connection closed"));

// ─── BullMQ connection options (uses ioredis-style config) ─────────
// BullMQ needs its own connection object — it won't accept the node-redis client

const bullMQConnection = {
  host:     REDIS_HOST,
  port:     Number(REDIS_PORT),
  password: REDIS_PASSWORD || undefined,
  db:       Number(REDIS_DB),
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,    // required by BullMQ
};

// ─── Connect helper called at app startup ──────────────────────────

const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info("Redis client initialised");
  } catch (err) {
    logger.error(`Redis connection failed: ${err.message}`);
    // Non-fatal — app can start without Redis (queues/rate-limits degrade gracefully)
  }
};

module.exports = redisClient;
module.exports.bullMQConnection = bullMQConnection;
module.exports.connectRedis     = connectRedis;
