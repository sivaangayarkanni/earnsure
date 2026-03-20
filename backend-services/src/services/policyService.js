import { query } from "../db/pg.js";

export async function listPolicies({ status, limit = 25 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  if (status) {
    const { rows } = await query(
      "SELECT * FROM policies WHERE status = $1 ORDER BY start_date DESC LIMIT $2",
      [status, safeLimit]
    );
    return rows;
  }

  const { rows } = await query(
    "SELECT * FROM policies ORDER BY start_date DESC LIMIT $1",
    [safeLimit]
  );
  return rows;
}

export async function getPolicyById(policyId) {
  const { rows } = await query("SELECT * FROM policies WHERE policy_id = $1", [policyId]);
  return rows[0] || null;
}

export async function createPolicy(data) {
  const {
    worker_id,
    plan_type,
    weekly_premium,
    coverage_details = {},
    status = "active",
    start_date,
    auto_renew = true,
  } = data;

  const { rows } = await query(
    `INSERT INTO policies
     (worker_id, plan_type, weekly_premium, coverage_details, status, start_date, auto_renew)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      worker_id,
      plan_type,
      weekly_premium,
      coverage_details,
      status,
      start_date,
      auto_renew,
    ]
  );

  return rows[0];
}
