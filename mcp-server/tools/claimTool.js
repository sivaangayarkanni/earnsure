import { query } from "../db/pg.js";

export const definition = {
  name: "claim_tool",
  description: "Create, update, or fetch claims for a policy.",
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["create", "get", "list", "update"] },
      claimId: { type: "string" },
      policyId: { type: "string" },
      eventType: { type: "string" },
      lostIncome: { type: "number" },
      claimStatus: { type: "string" },
      payoutAmount: { type: "number" },
      limit: { type: "integer", minimum: 1, maximum: 50 },
    },
  },
};

export async function handler({
  action = "list",
  claimId,
  policyId,
  eventType,
  lostIncome,
  claimStatus,
  payoutAmount,
  limit = 20,
}) {
  if (action === "create") {
    if (!policyId || !eventType) {
      throw new Error("policyId and eventType are required for claim creation.");
    }
    const { rows } = await query(
      `INSERT INTO claims (policy_id, event_type, lost_income, claim_status, payout_amount)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [policyId, eventType, lostIncome || 0, claimStatus || "submitted", payoutAmount || 0]
    );
    return { action, claim: rows[0] };
  }

  if (action === "get") {
    if (!claimId) {
      throw new Error("claimId is required for get.");
    }
    const { rows } = await query(
      "SELECT * FROM claims WHERE claim_id = $1",
      [claimId]
    );
    return { action, claim: rows[0] || null };
  }

  if (action === "update") {
    if (!claimId) {
      throw new Error("claimId is required for update.");
    }
    const { rows } = await query(
      `UPDATE claims
       SET claim_status = COALESCE($2, claim_status),
           payout_amount = COALESCE($3, payout_amount)
       WHERE claim_id = $1
       RETURNING *`,
      [claimId, claimStatus || null, payoutAmount ?? null]
    );
    return { action, claim: rows[0] || null };
  }

  if (!policyId) {
    throw new Error("policyId is required for list.");
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const { rows } = await query(
    `SELECT * FROM claims
     WHERE policy_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [policyId, safeLimit]
  );
  return { action: "list", claims: rows };
}
