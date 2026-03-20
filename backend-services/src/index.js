import dotenv from "dotenv";
import { createApp } from "./app.js";
import { logger } from "./lib/logger.js";
import { startRiskScheduler } from "./jobs/riskScheduler.js";
import { startPolicyScheduler } from "./jobs/policyScheduler.js";
import { startMetricsUpdater } from "./metrics/index.js";

dotenv.config();

const app = createApp();
const port = process.env.PORT || 3001;

app.listen(port, () => {
  logger.info(`Backend services listening on ${port}`);
  startRiskScheduler();
  startPolicyScheduler();
  startMetricsUpdater();
});
