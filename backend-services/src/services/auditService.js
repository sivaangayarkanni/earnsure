import { query } from "../db/pg.js";

export async function logAudit({
  actor_type = "system",
  actor_id = null,
  action,
  entity_type,
  entity_id = null,
  before_state = null,
  after_state = null,
}) {
  if (!action || !entity_type) return;
  await query(
    `INSERT INTO audit_logs (actor_type, actor_id, action, entity_type, entity_id, before_state, after_state)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      actor_type,
      actor_id,
      action,
      entity_type,
      entity_id,
      before_state,
      after_state,
    ]
  );
}
