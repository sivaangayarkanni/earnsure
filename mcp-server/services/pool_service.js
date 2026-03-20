import { getClient, query } from "../db/connection.js";
import { logAudit } from "./audit_service.js";

const reservePercent = Number(process.env.POOL_RESERVE_PERCENT || 0.1);
const poolPayoutCapPercent = Number(process.env.POOL_PAYOUT_CAP_PERCENT || 0);
const reinsuranceEnabled = process.env.REINSURANCE_ENABLED !== "false";
const reinsuranceSeed = Number(process.env.REINSURANCE_SEED_BALANCE || 0);
const allowReservePayout = process.env.ALLOW_RESERVE_PAYOUT !== "false";

async function ensureReinsuranceFund(client) {
  const { rows } = await client.query("SELECT * FROM reinsurance_fund ORDER BY created_at DESC LIMIT 1");
  if (rows[0]) return rows[0];
  const { rows: created } = await client.query(
    `INSERT INTO reinsurance_fund (total_balance)
     VALUES ($1)
     RETURNING *`,
    [reinsuranceSeed]
  );
  return created[0];
}

export async function createPool(city) {
  const { rows } = await query(
    `INSERT INTO pools (city, total_balance, reserve_fund)
     VALUES ($1, 0, 0)
     RETURNING *`,
    [city]
  );
  return rows[0];
}

export async function ensurePoolForCity(city) {
  const { rows } = await query(
    "SELECT * FROM pools WHERE city = $1 ORDER BY created_at DESC LIMIT 1",
    [city]
  );
  if (rows[0]) return rows[0];
  return createPool(city);
}

export async function joinPool({ worker_id, city, weekly_contribution }) {
  const pool = await ensurePoolForCity(city);
  const { rows } = await query(
    `INSERT INTO pool_members (pool_id, worker_id, weekly_contribution)
     VALUES ($1, $2, $3)
     ON CONFLICT (pool_id, worker_id) DO UPDATE
     SET weekly_contribution = EXCLUDED.weekly_contribution
     RETURNING *`,
    [pool.pool_id, worker_id, weekly_contribution]
  );
  return { pool, member: rows[0] };
}

export async function collectWeeklyContribution({ worker_id }) {
  const { rows: membershipRows } = await query(
    `SELECT pm.pool_id, pm.weekly_contribution
     FROM pool_members pm
     WHERE pm.worker_id = $1`,
    [worker_id]
  );
  const membership = membershipRows[0];
  if (!membership) throw new Error("Worker is not in a pool.");

  const contribution = Number(membership.weekly_contribution || 0);
  if (contribution <= 0) throw new Error("Weekly contribution must be > 0.");

  const client = await getClient();
  try {
    await client.query("BEGIN");
    const reserveCut = Math.max(0, contribution * reservePercent);
    const poolCut = contribution - reserveCut;
    await client.query(
      "UPDATE pools SET total_balance = total_balance + $1, reserve_fund = reserve_fund + $2 WHERE pool_id = $3",
      [poolCut, reserveCut, membership.pool_id]
    );
    await client.query(
      `INSERT INTO pool_transactions (pool_id, worker_id, type, amount)
       VALUES ($1, $2, 'contribution', $3)`,
      [membership.pool_id, worker_id, contribution]
    );
    if (reserveCut > 0) {
      await client.query(
        `INSERT INTO pool_transactions (pool_id, worker_id, type, amount)
         VALUES ($1, $2, 'reserve_move', $3)`,
        [membership.pool_id, worker_id, reserveCut]
      );
    }
    const { rows } = await client.query(
      "SELECT * FROM pools WHERE pool_id = $1",
      [membership.pool_id]
    );
    await client.query("COMMIT");
    await logAudit({
      action: "pool_contribution",
      entity_type: "pool",
      entity_id: membership.pool_id,
      after_state: rows[0],
    });
    return { pool: rows[0], contribution };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function calculatePoolBalance(pool_id) {
  const { rows } = await query(
    "SELECT pool_id, city, total_balance, reserve_fund FROM pools WHERE pool_id = $1",
    [pool_id]
  );
  return rows[0] || null;
}

export async function allocatePayout({ pool_id, claim_id, amount }) {
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
  if (payoutAmount <= 0) throw new Error("amount must be greater than zero.");

  const client = await getClient();
  try {
    await client.query("BEGIN");
    const { rows: poolRows } = await client.query(
      "SELECT total_balance FROM pools WHERE pool_id = $1 FOR UPDATE",
      [pool_id]
    );
    const pool = poolRows[0];
    if (!pool) throw new Error("Pool not found.");
    let remaining = payoutAmount;
    const poolBalance = Number(pool.total_balance || 0);
    const capLimit = poolPayoutCapPercent > 0 ? poolBalance * poolPayoutCapPercent : poolBalance;
    let poolDebit = Math.min(poolBalance, capLimit, remaining);
    if (poolDebit > 0) {
      await client.query(
        "UPDATE pools SET total_balance = total_balance - $1 WHERE pool_id = $2",
        [poolDebit, pool_id]
      );
      await client.query(
        `INSERT INTO pool_transactions (pool_id, worker_id, type, amount)
         VALUES ($1, $2, 'payout', $3)`,
        [pool_id, claim.worker_id, poolDebit]
      );
      remaining -= poolDebit;
    }

    let reserveDebit = 0;
    if (remaining > 0 && allowReservePayout) {
      const { rows: reserveRows } = await client.query(
        "SELECT reserve_fund FROM pools WHERE pool_id = $1 FOR UPDATE",
        [pool_id]
      );
      const reserve = Number(reserveRows[0]?.reserve_fund || 0);
      reserveDebit = Math.min(reserve, remaining);
      if (reserveDebit > 0) {
        await client.query(
          "UPDATE pools SET reserve_fund = reserve_fund - $1 WHERE pool_id = $2",
          [reserveDebit, pool_id]
        );
        await client.query(
          `INSERT INTO pool_transactions (pool_id, worker_id, type, amount)
           VALUES ($1, $2, 'reserve_move', $3)`,
          [pool_id, claim.worker_id, reserveDebit]
        );
        remaining -= reserveDebit;
      }
    }

    let reinsuranceDebit = 0;
    if (remaining > 0 && reinsuranceEnabled) {
      const fund = await ensureReinsuranceFund(client);
      const fundBalance = Number(fund.total_balance || 0);
      const fundDebit = Math.min(fundBalance, remaining);
      if (fundDebit > 0) {
        await client.query(
          "UPDATE reinsurance_fund SET total_balance = total_balance - $1 WHERE fund_id = $2",
          [fundDebit, fund.fund_id]
        );
        await client.query(
          `INSERT INTO reinsurance_transactions (pool_id, claim_id, amount, type)
           VALUES ($1, $2, $3, 'payout')`,
          [pool_id, claim_id, fundDebit]
        );
        await client.query(
          `INSERT INTO pool_transactions (pool_id, worker_id, type, amount)
           VALUES ($1, $2, 'reinsurance', $3)`,
          [pool_id, claim.worker_id, fundDebit]
        );
        remaining -= fundDebit;
        reinsuranceDebit = fundDebit;
      }
    }

    if (remaining > 0) {
      throw new Error("Insufficient pool + reserve + reinsurance balance.");
    }
    await client.query("COMMIT");
    const result = {
      pool_id,
      payout: payoutAmount,
      breakdown: {
        pool: Number(poolDebit.toFixed(2)),
        reserve: Number(reserveDebit.toFixed(2)),
        reinsurance: Number(reinsuranceDebit.toFixed(2)),
      },
    };
    await logAudit({
      action: "pool_payout",
      entity_type: "pool",
      entity_id: pool_id,
      after_state: result,
    });
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
