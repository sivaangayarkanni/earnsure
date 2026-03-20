const dotenv = require("dotenv");

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.warn(`[WARN] Missing environment variable: ${name} - will use fallback`);
    return null;
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  logLevel: process.env.LOG_LEVEL || "info",
  // Make DATABASE_URL optional - will use SQLite in development
  databaseUrl: process.env.DATABASE_URL || null,
  dbSync: String(process.env.DB_SYNC || "true").toLowerCase() === "true",
};

module.exports = { env };
