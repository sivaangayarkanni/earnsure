import {
  createPool,
  joinPool,
  collectWeeklyContribution,
  calculatePoolBalance,
  allocatePayout,
} from "../services/pool_service.js";

export const definition = {
  name: "risk_pool_tool",
  description: "Manage collective worker risk pools.",
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
      city: { type: "string" },
      pool_id: { type: "string" },
      worker_id: { type: "string" },
      weekly_contribution: { type: "number" },
      claim_id: { type: "string" },
      amount: { type: "number" },
    },
    required: ["action"],
  },
};

export async function handler({
  action,
  city,
  pool_id,
  worker_id,
  weekly_contribution,
  claim_id,
  amount,
}) {
  if (action === "create_pool") {
    if (!city) throw new Error("city is required for create_pool.");
    const pool = await createPool(city);
    return { pool };
  }

  if (action === "join_pool") {
    if (!city || !worker_id) {
      throw new Error("city and worker_id are required for join_pool.");
    }
    return joinPool({ worker_id, city, weekly_contribution: weekly_contribution || 0 });
  }

  if (action === "collect_weekly_contribution") {
    if (!worker_id) {
      throw new Error("worker_id is required for collect_weekly_contribution.");
    }
    return collectWeeklyContribution({ worker_id });
  }

  if (action === "calculate_pool_balance") {
    if (!pool_id) throw new Error("pool_id is required for calculate_pool_balance.");
    const pool = await calculatePoolBalance(pool_id);
    return { pool };
  }

  if (action === "allocate_payout") {
    if (!pool_id || !claim_id || amount == null) {
      throw new Error("pool_id, claim_id, and amount are required for allocate_payout.");
    }
    return allocatePayout({ pool_id, claim_id, amount });
  }

  throw new Error(`Unsupported action: ${action}`);
}
