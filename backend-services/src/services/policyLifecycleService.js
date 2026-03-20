import { query } from "../db/pg.js";
import { logAudit } from "./auditService.js";
import { sendWorkerNotification } from "./notificationService.js";

const GRACE_DAYS = Number(process.env.POLICY_PREMIUM_GRACE_DAYS || 3);
const LAPSE_DAYS = Number(process.env.POLICY_LAPSE_DAYS || 14);
const MAX_ATTEMPTS = Number(process.env.PREMIUM_COLLECTION_MAX_ATTEMPTS || 3);
const SIMULATE_COLLECTION = process.env.SIMULATE_PREMIUM_COLLECTION !== "false";

function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function calculateDueDate(startDate) {
  const start = new Date(startDate);
  const today = new Date();
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const cycles = Math.max(0, Math.floor(diffDays / 7));
  return addDays(start, cycles * 7);
}

async function ensurePayment(policy) {
  const dueDate = calculateDueDate(policy.start_date);
  const dueDateStr = toDateOnly(dueDate);
  const { rows } = await query(
    `SELECT * FROM policy_payments
     WHERE policy_id = $1 AND due_date = $2`,
    [policy.policy_id, dueDateStr]
  );
  if (rows[0]) return rows[0];

  const { rows: created } = await query(
    `INSERT INTO policy_payments (policy_id, worker_id, amount, due_date, status)
     VALUES ($1, $2, $3, $4, 'due')
     RETURNING *`,
    [policy.policy_id, policy.worker_id, policy.weekly_premium, dueDateStr]
  );
  return created[0];
}

async function markPaymentStatus(paymentId, status, providerRef = null) {
  const { rows } = await query(
    `UPDATE policy_payments
     SET status = $2,
         attempts = attempts + 1,
         last_attempt_at = now(),
         paid_at = CASE WHEN $2 = 'paid' THEN now() ELSE paid_at END,
         provider_reference = COALESCE($3, provider_reference)
     WHERE payment_id = $1
     RETURNING *`,
    [paymentId, status, providerRef]
  );
  const payment = rows[0] || null;
  if (payment) {
    await logAudit({
      action: status === "paid" ? "premium_paid" : "premium_attempt",
      entity_type: "policy_payment",
      entity_id: payment.payment_id,
      after_state: payment,
    });
  }
  return payment;
}

async function attemptCollection(payment) {
  if (payment.status === "paid") return payment;
  if (payment.attempts >= MAX_ATTEMPTS) return payment;

  if (SIMULATE_COLLECTION) {
    return markPaymentStatus(payment.payment_id, "paid", "simulated");
  }

  return markPaymentStatus(payment.payment_id, "failed");
}

async function updatePolicyStatus(policy, newStatus) {
  if (policy.status === newStatus) return policy;
  const { rows } = await query(
    `UPDATE policies
     SET status = $2
     WHERE policy_id = $1
     RETURNING *`,
    [policy.policy_id, newStatus]
  );
  await logAudit({
    action: "policy_status_updated",
    entity_type: "policy",
    entity_id: policy.policy_id,
    before_state: policy,
    after_state: rows[0],
  });
  return rows[0];
}

async function renewPolicy(policy) {
  const today = toDateOnly(new Date());
  const { rows } = await query(
    `UPDATE policies
     SET status = 'active', start_date = $2
     WHERE policy_id = $1
     RETURNING *`,
    [policy.policy_id, today]
  );
  await logAudit({
    action: "policy_renewed",
    entity_type: "policy",
    entity_id: policy.policy_id,
    before_state: policy,
    after_state: rows[0],
  });
  return rows[0];
}

async function evaluatePolicy(policy) {
  const payment = await ensurePayment(policy);
  const dueDate = new Date(payment.due_date);
  const today = new Date();
  const overdueDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

  let updatedPayment = payment;
  if (payment.status !== "paid" && dueDate <= today) {
    updatedPayment = await attemptCollection(payment);
  }

  if (updatedPayment.status !== "paid" && overdueDays >= GRACE_DAYS) {
    await markPaymentStatus(updatedPayment.payment_id, "delinquent");
    if (policy.status !== "paused") {
      await updatePolicyStatus(policy, "paused");
      await sendWorkerNotification({
        workerId: policy.worker_id,
        type: "claim",
        message: "Your policy is paused due to missed premium payment. Please update payment details.",
        dedupeHours: 24,
      });
    }
  }

  if (updatedPayment.status !== "paid" && overdueDays >= LAPSE_DAYS) {
    await updatePolicyStatus(policy, "expired");
  }

  if (updatedPayment.status === "paid" && policy.status === "paused") {
    await updatePolicyStatus(policy, "active");
  }

  return { payment: updatedPayment };
}

export async function runPolicyLifecycle() {
  const { rows } = await query(
    `SELECT policy_id, worker_id, weekly_premium, status, start_date, auto_renew
     FROM policies`
  );

  for (const policy of rows) {
    if (policy.status === "cancelled") continue;
    if (policy.status === "expired" && policy.auto_renew) {
      await renewPolicy(policy);
    }
    if (policy.status === "expired" && !policy.auto_renew) continue;
    await evaluatePolicy(policy);
  }
}
