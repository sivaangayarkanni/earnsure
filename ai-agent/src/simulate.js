import dotenv from "dotenv";
import pg from "pg";
import { connectMcpClient, callTool } from "./mcpClient.js";

dotenv.config();

const { Pool } = pg;

function logStep(step, message, meta) {
  const prefix = `[${step}]`;
  if (meta) {
    console.log(prefix, message, JSON.stringify(meta, null, 2));
  } else {
    console.log(prefix, message);
  }
}

async function callMcpTool(client, name, args) {
  const response = await callTool(client, name, args);
  const text = response?.content?.[0]?.text || "{}";
  const parsed = JSON.parse(text);
  if (!parsed.ok) {
    throw new Error(parsed.error || `Tool ${name} failed.`);
  }
  return parsed.result;
}

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is required for simulation.");
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
  });

  logStep("1", "Registering worker Ravi");
  const phone = `+91${Date.now().toString().slice(-10)}`;
  const { rows: workerRows } = await pool.query(
    `INSERT INTO workers (name, phone, city, platform, risk_score)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    ["Ravi", phone, "Bengaluru", "SwiftRide", 0.35]
  );
  const worker = workerRows[0];
  logStep("1", "Worker created", { worker_id: worker.id, city: worker.city });

  logStep("2", "Creating policy");
  const { rows: policyRows } = await pool.query(
    `INSERT INTO policies
     (worker_id, plan_type, weekly_premium, coverage_details, status, start_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      worker.id,
      "Monsoon Shield",
      185,
      { coverage: "Lost income during heavy rain", weekly_cap: 3500 },
      "active",
      new Date().toISOString().slice(0, 10),
    ]
  );
  const policy = policyRows[0];
  logStep("2", "Policy created", { policy_id: policy.policy_id, status: policy.status });

  logStep("3", "Detecting heavy rain signal", { city: worker.city });

  const client = await connectMcpClient();

  logStep("4", "AI agent calling weather_tool", { city: worker.city });
  let weather;
  try {
    weather = await callMcpTool(client, "weather_tool", { city: worker.city });
    logStep("4", "Weather received", weather);
  } catch (err) {
    logStep("4", "Weather tool failed, using synthetic heavy rain", {
      error: err.message,
    });
    weather = {
      rainfall_mm: 28,
      temperature: 24,
      weather_condition: "heavy rain",
      timestamp: new Date().toISOString(),
    };
  }

  logStep("5", "AI agent triggering claim_tool");
  const claimCreate = await callMcpTool(client, "claim_tool", {
    action: "create",
    policy_id: policy.policy_id,
    event_type: "weather_disruption",
  });
  const claim = claimCreate.claim;
  logStep("5", "Claim submitted", { claim_id: claim.claim_id, status: claim.claim_status });

  logStep("6", "Running fraud_detection_tool");
  const fraudCheck = await callMcpTool(client, "fraud_detection_tool", {
    worker_id: worker.id,
    claim_id: claim.claim_id,
  });
  logStep("6", "Fraud check result", fraudCheck);

  if (fraudCheck.flagged) {
    logStep("6", "Claim flagged. Simulation stopping before payout.");
    await pool.end();
    return;
  }

  logStep("6", "Approving claim");
  await callMcpTool(client, "claim_tool", {
    action: "update",
    claim_id: claim.claim_id,
    claim_status: "approved",
  });

  logStep("7", "Ensuring pool membership and balance");
  const joinPool = await callMcpTool(client, "risk_pool_tool", {
    action: "join_pool",
    worker_id: worker.id,
    city: worker.city,
    weekly_contribution: 2500,
  });
  const poolId = joinPool.pool.pool_id;
  await callMcpTool(client, "risk_pool_tool", {
    action: "collect_weekly_contribution",
    worker_id: worker.id,
  });

  logStep("7", "Allocating payout from pool", {
    pool_id: poolId,
    amount: claim.payout_amount,
  });
  const payout = await callMcpTool(client, "risk_pool_tool", {
    action: "allocate_payout",
    pool_id: poolId,
    claim_id: claim.claim_id,
    amount: claim.payout_amount,
  });
  logStep("7", "Payout allocated", payout);

  logStep("8", "Sending payment via payment_tool");
  const payment = await callMcpTool(client, "payment_tool", {
    worker_id: worker.id,
    amount: claim.payout_amount,
  });
  logStep("8", "Payment complete", payment);

  await pool.end();
  logStep("done", "Simulation complete");
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
