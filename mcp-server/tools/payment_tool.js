export const definition = {
  name: "payment_tool",
  description: "Simulate or execute UPI payouts and record transactions.",
  inputSchema: {
    type: "object",
    properties: {
      worker_id: { type: "string" },
      amount: { type: "number", minimum: 0.01 },
      upi_id: { type: "string" },
      claim_id: { type: "string" },
    },
    required: ["worker_id", "amount"],
  },
};

function getProvider() {
  return process.env.UPI_PROVIDER || "simulate";
}

async function sendRazorpayPayout({ worker_id, upi_id, amount }) {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const account = process.env.RAZORPAY_ACCOUNT_NUMBER;

  if (!key || !secret || !account) {
    throw new Error("Razorpay credentials are not set.");
  }

  if (!upi_id) {
    throw new Error("UPI ID is required for Razorpay payout.");
  }

  const payload = {
    account_number: account,
    amount: Math.round(amount * 100),
    currency: "INR",
    mode: "UPI",
    purpose: "payout",
    queue_if_low_balance: true,
    reference_id: `earnsure-${worker_id}-${Date.now()}`,
    narration: "EarnSure payout",
    fund_account: {
      account_type: "vpa",
      vpa: {
        address: upi_id,
      },
    },
  };

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/payouts", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.description || "Razorpay payout failed");
  }

  return { status: data.status || "processing", reference: data.id };
}

import { query } from "../db/connection.js";
import { logAudit } from "../services/audit_service.js";

export async function handler({ worker_id, amount, upi_id, claim_id }) {
  const payoutAmount = Number(amount);
  if (!worker_id) throw new Error("worker_id is required.");
  if (Number.isNaN(payoutAmount) || payoutAmount <= 0) {
    throw new Error("amount must be a positive number.");
  }

  const { rows: workerRows } = await query(
    "SELECT upi_id FROM workers WHERE id = $1",
    [worker_id]
  );
  const workerUpi = workerRows[0]?.upi_id || upi_id || process.env.UPI_DEFAULT_VPA;

  const provider = getProvider();
  let payment_status = "completed";
  let provider_reference = null;

  if (provider === "razorpay") {
    const result = await sendRazorpayPayout({
      worker_id,
      upi_id: workerUpi,
      amount: payoutAmount,
    });
    payment_status = result.status;
    provider_reference = result.reference;
  }

  const { rows } = await query(
    `INSERT INTO transactions (worker_id, claim_id, amount, status, payment_method, provider, provider_reference)
     VALUES ($1, $2, $3, $4, 'UPI', $5, $6)
     RETURNING transaction_id`,
    [worker_id, claim_id || null, payoutAmount, payment_status, provider, provider_reference]
  );

  await logAudit({
    action: "payment_sent",
    entity_type: "transaction",
    entity_id: rows[0]?.transaction_id,
    after_state: {
      worker_id,
      claim_id,
      amount: payoutAmount,
      status: payment_status,
      provider,
      provider_reference,
    },
  });

  return {
    payment_status,
    transaction_id: rows[0]?.transaction_id,
    provider,
    provider_reference,
  };
}
