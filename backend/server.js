const { env } = require("./config/env");
const { logger } = require("./utils/logger");
const { createApp } = require("./app");
const { sequelize } = require("./models");

const app = createApp();

async function start() {
  await sequelize.authenticate();
  if (env.dbSync) {
    await sequelize.sync();
  }
  app.listen(env.port, () => {
    logger.info("server_listening", { port: env.port });
  });
}

start().catch((err) => {
  logger.error("startup_failed", { err });
  process.exit(1);
});
