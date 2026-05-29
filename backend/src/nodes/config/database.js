const { Sequelize } = require("sequelize");
const logger = require("../utils/logger");

const {
  DB_HOST     = "localhost",
  DB_PORT     = 5432,
  DB_NAME     = "flowapp",
  DB_USER     = "postgres",
  DB_PASSWORD = "",
  DB_SSL      = "false",
  NODE_ENV    = "development",
} = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host:    DB_HOST,
  port:    Number(DB_PORT),
  dialect: "postgres",

  ssl: DB_SSL === "true",
  dialectOptions:
    DB_SSL === "true"
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},

  pool: {
    max:     10,   // max connections in pool
    min:     2,    // always keep 2 alive
    acquire: 30000, // ms to wait before "connection not available" error
    idle:    10000, // ms a connection can sit idle before release
  },

  logging:
    NODE_ENV === "development"
      ? (sql) => logger.debug(`[SQL] ${sql}`)
      : false,

  define: {
    underscored:   true,   // snake_case columns by default
    freezeTableName: true, // don't pluralise table names automatically
  },
});

// Test + export
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info("PostgreSQL connected successfully");
  } catch (err) {
    logger.error(`PostgreSQL connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = sequelize;
module.exports.connectDB = connectDB;
