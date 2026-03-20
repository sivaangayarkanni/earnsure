import { query } from "../db/pg.js";
import { createPayout } from "./payoutService.js";

function evaluateOperator(operator, observedValue, threshold) {
  switch (operator) {
    case ">":
      return observedValue > threshold;
    case ">=":
      return observedValue >= threshold;
    case "<":
      return observedValue < threshold;
    case "<=":
      return observedValue <= threshold;
    case "==":
    case "=":
      return observedValue === threshold;
    default:
      return false;
  }
}

export async function evaluateTrigger({
  policyId,
  triggerType,
  observedValue,
  observedAt,
  dryRun = false,
}) {
  const { rows } = await query(
    `SELECT * FROM parametric_triggers
     WHERE policy_id = $1 AND trigger_type = $2 AND status = 'armed'
     ORDER BY created_at DESC
     LIMIT 1`,
    [policyId, triggerType]
  );

  const trigger = rows[0];
  if (!trigger) {
    return {
      status: "no_trigger",
      message: "No armed trigger found for policy.",
    };
  }

  const config = trigger.trigger_config || {};
  const threshold = Number(config.threshold ?? 0);
  const operator = config.operator || ">=";
  const payoutCents = Number(config.payout_cents ?? 0);
  const currency = config.currency || "USD";

  const triggered = evaluateOperator(operator, Number(observedValue), threshold);
  if (!triggered) {
    return {
      status: "not_met",
      triggerId: trigger.id,
      operator,
      threshold,
      observedValue: Number(observedValue),
    };
  }

  if (dryRun) {
    return {
      status: "would_trigger",
      triggerId: trigger.id,
      payoutCents,
      currency,
    };
  }

  const payout = await createPayout({
    policyId,
    triggerId: trigger.id,
    amountCents: payoutCents,
    currency,
    reason: `Trigger ${triggerType} met at ${observedAt || "unknown time"}`,
  });

  await query(
    "UPDATE parametric_triggers SET status = 'triggered', updated_at = now() WHERE id = $1",
    [trigger.id]
  );

  return {
    status: "triggered",
    triggerId: trigger.id,
    payout,
  };
}
