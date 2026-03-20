import { query } from "../db/pg.js";

export async function updateWorkerProfile({ worker_id, upi_id }) {
  const { rows } = await query(
    `UPDATE workers
     SET upi_id = COALESCE($2, upi_id)
     WHERE id = $1
     RETURNING id, name, phone, city, platform, risk_score, upi_id`,
    [worker_id, upi_id]
  );
  return rows[0] || null;
}
