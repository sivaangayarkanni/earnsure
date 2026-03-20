const { Sequelize, DataTypes } = require("sequelize");
const { env } = require("../config/env");
const { logger = console } = require("../utils/logger");
const path = require("path");

// Use SQLite for development if DATABASE_URL is not a valid postgres connection
// This allows testing without Docker/PostgreSQL
let sequelize;
const isDevMode = env.nodeEnv === "development";
const isSQLite = isDevMode && (!env.databaseUrl || !env.databaseUrl.startsWith("postgres://"));

if (isSQLite) {
  // SQLite for development
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: path.join(__dirname, "../../earnsure.db"),
    logging: false,
  });
  console.log("[DB] Using SQLite for development");
} else {
  // PostgreSQL for production
  sequelize = new Sequelize(env.databaseUrl, {
    dialect: "postgres",
    logging: isDevMode ? (msg) => logger.debug?.("sql", { msg }) : false,
  });
  console.log("[DB] Using PostgreSQL");
}

// Export for use in models
module.exports.isSQLite = isSQLite;

const Worker = require("./worker")(sequelize, DataTypes);
const Policy = require("./policy")(sequelize, DataTypes);
const Claim = require("./claim")(sequelize, DataTypes);
const RiskEvent = require("./riskEvent")(sequelize, DataTypes);
const Pool = require("./pool")(sequelize, DataTypes);

// Associations
Policy.hasMany(Claim, { foreignKey: "policy_id", as: "claims" });
Claim.belongsTo(Policy, { foreignKey: "policy_id", as: "policy" });
Worker.hasMany(Policy, { foreignKey: "worker_id", as: "policies" });
Policy.belongsTo(Worker, { foreignKey: "worker_id", as: "worker" });

const models = { Worker, Policy, Claim, RiskEvent, Pool };

module.exports = { sequelize, models };
