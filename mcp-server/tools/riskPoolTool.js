import { query, getClient } from "../db/pg.js";

export const definition = {
  name: "risk_pool_tool",
  description: "Manage worker community risk pools.",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "create_pool",
          "join_pool",
          "collect_weekly_contribution",
          "calculate_pool_balance",
          "allocate_payout",
        ],
      },
      pool_id: { type: "string" },
      city: { type: "string" },
      worker_id: { type: "string" },
      weekly_contribution: { type: "number" },
      claim_id: { type: "string" },
      amount: { type: "number" },
    },
  },
};

export async function handler({
  action = "calculate_pool_balance",
  pool_id,
  city,
  worker_id,
  weekly_contribution,
  claim_id,
  amount,
}) {
  if (action === "create_pool") {
    if (!city) throw new Error("city is required for create_pool.");
    const { rows } = await query(
      `INSERT INTO pools (city, total_balance, reserve_fund)
       VALUES ($1, 0, 0)
       RETURNING *`,
      [city]
    );
    return { action, pool: rows[0] };
  }

  if (action === "join_pool") {
    if (!worker_id) {
      throw new Error("worker_id is required for join_pool.");
    }

    const { rows: workerRows } = await query(
      "SELECT id, city FROM workers WHERE id = $1",
      [worker_id]
    );
    const worker = workerRows[0];
    if (!worker) throw new Error("Worker not found.");

    const poolCity = city || worker.city;
    if (!poolCity) throw new Error("city is required for join_pool.");

    let { rows: poolRows } = await query(
      "SELECT * FROM pools WHERE city = $1 ORDER BY created_at DESC LIMIT 1",
      [poolCity]
    );
    let pool = poolRows[0];
    if (!pool) {
      const created = await query(
        `INSERT INTO pools (city, total_balance, reserve_fund)
         VALUES ($1, 0, 0)
         RETURNING *`,
        [poolCity]
      );
      pool = created.rows[0];
    }

    const defaultContribution = Number(
      process.env.RISK_POOL_DEFAULT_WEEKLY_CONTRIBUTION || 0
    );
    const contribution = Number(weekly_contribution ?? defaultContribution);

    const { rows: memberRows } = await query(
      `INSERT INTO pool_members (pool_id, worker_id, weekly_contribution)
       VALUES ($1, $2, $3)
       ON CONFLICT (pool_id, worker_id) DO UPDATE
       SET weekly_contribution = EXCLUDED.weekly_contribution
       RETURNING *`,
      [pool.pool_id, worker_id, contribution]
    );

    return { action, pool, member: memberRows[0] };
  }

  if (action === "collect_weekly_contribution") {
    if (!worker_id) {
      throw new Error("worker_id is required for collect_weekly_contribution.");
    }

    const { rows: membershipRows } = await query(
      `SELECT pm.pool_id, pm.weekly_contribution
       FROM pool_members pm
       WHERE pm.worker_id = $1`,
      [worker_id]
    );
    const membership = membershipRows[0];
    if (!membership) {
      throw new Error("Worker is not a member of any pool.");
    }

    const contributionAmount = Number(membership.weekly_contribution || 0);
    if (contributionAmount <= 0) {
      throw new Error("Weekly contribution must be greater than zero.");
    }

    const client = await getClient();
    try {
      await client.query("BEGIN");
      await client.query(
        "UPDATE pools SET total_balance = total_balance + $1 WHERE pool_id = $2",
        [contributionAmount, membership.pool_id]
      );
      await client.query(
        `INSERT INTO pool_transactions (pool_id, worker_id, type, amount)
         VALUES ($1, $2, 'contribution', $3)`,
        [membership.pool_id, worker_id, contributionAmount]
      );
      const { rows: poolRows } = await client.query(
        "SELECT * FROM pools WHERE pool_id = $1",
        [membership.pool_id]
      );
      await client.query("COMMIT");
      return {
        action,
        pool: poolRows[0],
        contribution: contributionAmount,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  if (action === "calculate_pool_balance") {
    if (!pool_id) {
      throw new Error("pool_id is required for calculate_pool_balance.");
    }
    const { rows } = await query(
      "SELECT pool_id, city, total_balance, reserve_fund FROM pools WHERE pool_id = $1",
      [pool_id]
    );
    return { action, pool: rows[0] || null };
  }

  if (action === "allocate_payout") {
    if (!pool_id || !claim_id || amount == null) {
      throw new Error("pool_id, claim_id, and amount are required for allocate_payout.");
    }

    const { rows: claimRows } = await query(
      `SELECT c.claim_id, c.claim_status, p.worker_id
       FROM claims c
       JOIN policies p ON c.policy_id = p.policy_id
       WHERE c.claim_id = $1`,
      [claim_id]
    );
    const claim = claimRows[0];
    if (!claim) throw new Error("Claim not found.");
    if (claim.claim_status !== "approved") {
      throw new Error("Claim must be approved before payout allocation.");
    }

    const payoutAmount = Number(amount);
    if (payoutAmount <= 0) {
      throw new Error("amount must be greater than zero.");
    }

    const client = await getClient();
    try {
      await client.query("BEGIN");
      const { rows: poolRows } = await client.query(
        "SELECT total_balance FROM pools WHERE pool_id = $1 FOR UPDATE",
        [pool_id]
      );
      const pool = poolRows[0];
      if (!pool) throw new Error("Pool not found.");
      if (Number(pool.total_balance) < payoutAmount) {
        throw new Error("Insufficient pool balance.");
      }

      await client.query(
        "UPDATE pools SET total_balance = total_balance - $1 WHERE pool_id = $2",
        [payoutAmount, pool_id]
      );
      await client.query(
        `INSERT INTO pool_transactions (pool_id, worker_id, type, amount)
         VALUES ($1, $2, 'payout', $3)`,
        [pool_id, claim.worker_id, payoutAmount]
      );

      await client.query("COMMIT");
      const { rows: updatedPool } = await query(
        "SELECT pool_id, city, total_balance, reserve_fund FROM pools WHERE pool_id = $1",
        [pool_id]
      );
      return { action, pool: updatedPool[0], payout: payoutAmount };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  throw new Error(`Unsupported action: ${action}`);
}
