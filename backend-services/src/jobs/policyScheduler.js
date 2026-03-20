import { logger } from "../lib/logger.js";
import { runPolicyLifecycle } from "../services/policyLifecycleService.js";

export function startPolicyScheduler() {
  const enabled = process.env.ENABLE_POLICY_SCHEDULER === "true";
  if (!enabled) return;

  const intervalMinutes = Number(process.env.POLICY_SCHEDULER_MINUTES || 60);
  const intervalMs = Math.max(intervalMinutes, 5) * 60 * 1000;

  async function run() {
    try {
      await runPolicyLifecycle();
      logger.info("Policy lifecycle job completed");
    } catch (err) {
      logger.error({ err }, "Policy lifecycle job failed");
    }
  }

  run();
  setInterval(run, intervalMs);
  logger.info({ intervalMinutes }, "Policy scheduler started");
}
