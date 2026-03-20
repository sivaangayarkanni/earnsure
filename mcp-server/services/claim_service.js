import { query } from "../db/connection.js";
import { logAudit } from "./audit_service.js";

const HOURLY_INCOME = 120;
const LOST_HOURS = 3;

export function calculateLostIncome() {
  return HOURLY_INCOME * LOST_HOURS;
}

export async function createClaim({ policy_id, event_type }) {
  const lost_income = calculateLostIncome();
  const { rows } = await query(
    `INSERT INTO claims (policy_id, event_type, lost_income, claim_status, payout_amount)
     VALUES ($1, $2, $3, 'submitted', $4)
     RETURNING *`,
    [policy_id, event_type, lost_income, lost_income]
  );
  await logAudit({
    action: "claim_created",
    entity_type: "claim",
    entity_id: rows[0]?.claim_id,
    after_state: rows[0],
  });
  return rows[0];
}

export async function updateClaimStatus({ claim_id, claim_status }) {
  const { rows: beforeRows } = await query(
    "SELECT * FROM claims WHERE claim_id = $1",
    [claim_id]
  );
  const { rows } = await query(
    `UPDATE claims
     SET claim_status = $2
     WHERE claim_id = $1
     RETURNING *`,
    [claim_id, claim_status]
  );
  await logAudit({
    action: "claim_status_updated",
    entity_type: "claim",
    entity_id: rows[0]?.claim_id,
    before_state: beforeRows[0] || null,
    after_state: rows[0] || null,
  });
  return rows[0] || null;
}

export async function getClaim(claim_id) {
  const { rows } = await query(
    "SELECT * FROM claims WHERE claim_id = $1",
    [claim_id]
  );
  return rows[0] || null;
}
