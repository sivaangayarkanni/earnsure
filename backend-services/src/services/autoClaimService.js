import { query } from "../db/pg.js";
import { callMcpTool } from "../mcp/client.js";
import { sendWorkerNotification } from "./notificationService.js";
import { logger } from "../lib/logger.js";

const FRAUD_THRESHOLD = Number(process.env.FRAUD_SCORE_THRESHOLD || 0.6);
const DEDUPE_HOURS = Number(process.env.DOWNTIME_CLAIM_WINDOW_HOURS || 12);

async function getActivePolicy(workerId) {
  const { rows } = await query(
    `SELECT * FROM policies
     WHERE worker_id = $1 AND status = 'active'
     ORDER BY start_date DESC
     LIMIT 1`,
    [workerId]
  );
  return rows[0] || null;
}

async function hasRecentClaim(policyId, eventType) {
  const { rows } = await query(
    `SELECT claim_id
     FROM claims
     WHERE policy_id = $1
       AND event_type = $2
       AND created_at > now() - ($3::text || ' hours')::interval
     LIMIT 1`,
    [policyId, eventType, DEDUPE_HOURS]
  );
  return Boolean(rows[0]);
}

export async function triggerDowntimeClaim({ workerId, city }) {
  const policy = await getActivePolicy(workerId);
  if (!policy) {
    return { status: "no_policy" };
  }

  const eventType = "algorithm_downtime";
  if (await hasRecentClaim(policy.policy_id, eventType)) {
    return { status: "duplicate" };
  }

  const poolJoin = await callMcpTool("risk_pool_tool", {
    action: "join_pool",
    city,
    worker_id: workerId,
    weekly_contribution: Number(policy.weekly_premium || 0),
  });

  const claimResult = await callMcpTool("claim_tool", {
    action: "create",
    policy_id: policy.policy_id,
    event_type: eventType,
  });

  await callMcpTool("claim_tool", {
    action: "update",
    claim_id: claimResult.claim.claim_id,
    claim_status: "approved",
  });

  const fraud = await callMcpTool("fraud_detection_tool", {
    worker_id: workerId,
    claim_id: claimResult.claim.claim_id,
  });

  if (fraud.fraud_score >= FRAUD_THRESHOLD) {
    await callMcpTool("claim_tool", {
      action: "update",
      claim_id: claimResult.claim.claim_id,
      claim_status: "rejected",
    });
    await sendWorkerNotification({
      workerId,
      type: "fraud",
      message: "Claim flagged for review due to unusual activity.",
    });
    return { status: "flagged", claim_id: claimResult.claim.claim_id, fraud };
  }

  let payout = null;
  let payment = null;
  try {
    payout = await callMcpTool("risk_pool_tool", {
      action: "allocate_payout",
      pool_id: poolJoin.pool.pool_id,
      claim_id: claimResult.claim.claim_id,
      amount: claimResult.claim.payout_amount,
    });
  } catch (err) {
    await sendWorkerNotification({
      workerId,
      type: "claim",
      message: "Downtime claim approved but pool balance is low. Payout queued.",
    });
    logger.warn({ err }, "Pool payout allocation failed");
    return { status: "approved", claim_id: claimResult.claim.claim_id, fraud };
  }

  try {
    payment = await callMcpTool("payment_tool", {
      worker_id: workerId,
      amount: claimResult.claim.payout_amount,
      claim_id: claimResult.claim.claim_id,
    });
  } catch (err) {
    await sendWorkerNotification({
      workerId,
      type: "claim",
      message: "Payout processing encountered a delay. EarnSure team is on it.",
    });
    logger.warn({ err }, "Payment tool failed");
    return { status: "approved", claim_id: claimResult.claim.claim_id, payout, fraud };
  }

  await callMcpTool("claim_tool", {
    action: "update",
    claim_id: claimResult.claim.claim_id,
    claim_status: "paid",
  });

  await sendWorkerNotification({
    workerId,
    type: "payout",
    message: `EarnSure payout of ?${claimResult.claim.payout_amount} sent for downtime disruption.`,
  });

  logger.info({ workerId, claimId: claimResult.claim.claim_id }, "Downtime claim paid");

  return {
    status: "paid",
    claim_id: claimResult.claim.claim_id,
    payout,
    payment,
    fraud,
  };
}
