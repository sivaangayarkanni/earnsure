import { query } from "../db/pg.js";

export async function createTrigger({
  policyId,
  triggerType,
  triggerConfig,
}) {
  const { rows } = await query(
    `INSERT INTO parametric_triggers
     (policy_id, trigger_type, trigger_config, status)
     VALUES ($1, $2, $3, 'armed')
     RETURNING *`,
    [policyId, triggerType, triggerConfig]
  );
  return rows[0];
}

export async function evaluateTrigger({
  policyId,
  triggerType,
  observedValue,
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
    return { status: "no_trigger" };
  }

  const config = trigger.trigger_config || {};
  const threshold = Number(config.threshold ?? 0);
  const operator = config.operator || ">=";

  const meets = operator === ">="
    ? Number(observedValue) >= threshold
    : operator === ">"
      ? Number(observedValue) > threshold
      : operator === "<="
        ? Number(observedValue) <= threshold
        : operator === "<"
          ? Number(observedValue) < threshold
          : Number(observedValue) === threshold;

  return {
    status: meets ? "met" : "not_met",
    triggerId: trigger.id,
    threshold,
    observedValue: Number(observedValue),
  };
}
