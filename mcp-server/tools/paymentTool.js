import { query } from "../db/pg.js";

export const definition = {
  name: "payment_tool",
  description: "Simulate a UPI payout to a worker and store the transaction.",
  inputSchema: {
    type: "object",
    properties: {
      worker_id: { type: "string" },
      amount: { type: "number", minimum: 0.01 },
    },
    required: ["worker_id", "amount"],
  },
};

export async function handler({ worker_id, amount }) {
  if (!worker_id) {
    throw new Error("worker_id is required.");
  }
  const payoutAmount = Number(amount);
  if (Number.isNaN(payoutAmount) || payoutAmount <= 0) {
    throw new Error("amount must be a positive number.");
  }

  const payment_status = "completed";
  const payment_method = "UPI";

  const { rows } = await query(
    `INSERT INTO transactions (worker_id, amount, status, payment_method)
     VALUES ($1, $2, $3, $4)
     RETURNING transaction_id`,
    [worker_id, payoutAmount, payment_status, payment_method]
  );

  return {
    payment_status,
    transaction_id: rows[0]?.transaction_id,
  };
}
