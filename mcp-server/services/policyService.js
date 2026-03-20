import { query } from "../db/pg.js";

export async function getPolicy({ policyId, policyNumber }) {
  if (!policyId && !policyNumber) {
    throw new Error("Provide policyId or policyNumber.");
  }

  if (policyId) {
    const { rows } = await query(
      "SELECT * FROM policies WHERE id = $1 LIMIT 1",
      [policyId]
    );
    return rows[0] || null;
  }

  const { rows } = await query(
    "SELECT * FROM policies WHERE policy_number = $1 LIMIT 1",
    [policyNumber]
  );
  return rows[0] || null;
}

export async function listPolicies({ status, limit = 25 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  if (status) {
    const { rows } = await query(
      "SELECT * FROM policies WHERE status = $1 ORDER BY created_at DESC LIMIT $2",
      [status, safeLimit]
    );
    return rows;
  }

  const { rows } = await query(
    "SELECT * FROM policies ORDER BY created_at DESC LIMIT $1",
    [safeLimit]
  );
  return rows;
}
