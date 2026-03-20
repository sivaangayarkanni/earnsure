import { query } from "../db/pg.js";

export async function listPayouts({ policyId, limit = 25 }) {
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const { rows } = await query(
    "SELECT * FROM payouts WHERE policy_id = $1 ORDER BY created_at DESC LIMIT $2",
    [policyId, safeLimit]
  );
  return rows;
}

export async function createPayout({ policyId, triggerId, amountCents, currency, reason }) {
  const { rows } = await query(
    `INSERT INTO payouts
     (policy_id, trigger_id, amount_cents, currency, status, reason)
     VALUES ($1, $2, $3, $4, 'initiated', $5)
     RETURNING *`,
    [policyId, triggerId || null, amountCents, currency || "USD", reason || null]
  );
  return rows[0];
}
