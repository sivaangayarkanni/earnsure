import { query } from "../db/connection.js";

export async function createPolicy({
  worker_id,
  plan_type,
  weekly_premium,
  coverage_details,
  status = "active",
  start_date,
}) {
  const { rows } = await query(
    `INSERT INTO policies
     (worker_id, plan_type, weekly_premium, coverage_details, status, start_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      worker_id,
      plan_type,
      weekly_premium,
      coverage_details || {},
      status,
      start_date,
    ]
  );
  return rows[0];
}

export async function getPolicy(policy_id) {
  const { rows } = await query(
    "SELECT * FROM policies WHERE policy_id = $1",
    [policy_id]
  );
  return rows[0] || null;
}
