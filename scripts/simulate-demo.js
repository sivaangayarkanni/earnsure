import dotenv from "dotenv";
import pg from "pg";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", "mcp-server", ".env") });
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
  const response = await client.request(CallToolRequestSchema, {
    name,
    arguments: args,
  });
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

  logStep("1", "Register worker Ravi");
  const phone = `+91${Date.now().toString().slice(-10)}`;
  const { rows: workerRows } = await pool.query(
    `INSERT INTO workers (name, phone, city, platform, risk_score)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    ["Ravi", phone, "Bengaluru", "SwiftRide", 0.35]
  );
  const worker = workerRows[0];
  logStep("1", "Worker registered", { worker_id: worker.id, city: worker.city });

  await pool.query(
    `INSERT INTO worker_activity (worker_id, city)
     VALUES ($1, $2)`,
    [worker.id, worker.city]
  );

  logStep("2", "Create policy");
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
  logStep("2", "Policy created", { policy_id: policy.policy_id });

  const serverPath = path.resolve(__dirname, "..", "mcp-server", "server.js");
  const transport = new StdioClientTransport({
    command: process.env.MCP_SERVER_CMD || "node",
    args: [serverPath],
  });
  const client = new Client(
    { name: "earnsure-sim", version: "1.0.0" },
    { capabilities: {} }
  );
  await client.connect(transport);

  logStep("3", "Detect heavy rain event", { city: worker.city });
  const weather = await callMcpTool(client, "weather_tool", { city: worker.city });
  logStep("4", "AI agent calls weather_tool", weather);

  logStep("4a", "Seed platform demand + worker activity");
  await pool.query(
    `INSERT INTO platform_demand (city, zone, orders_per_hour, active_workers, demand_index)
     VALUES ($1, $2, $3, $4, $5)`,
    [worker.city, "Indiranagar", 12, 18, 26]
  );
  await pool.query(
    `INSERT INTO worker_activity
     (worker_id, city, zone, online_status, orders_received, orders_accepted, earnings)
     VALUES ($1, $2, $3, true, $4, $5, $6)`,
    [worker.id, worker.city, "Indiranagar", 1, 1, 65]
  );

  logStep("4b", "Detect algorithm downtime");
  const downtime = await callMcpTool(client, "algorithm_downtime_tool", {
    worker_id: worker.id,
    city: worker.city,
    zone: "Indiranagar",
    online_status: true,
    orders_received: 1,
  });
  logStep("4b", "Downtime check", downtime);

  logStep("4c", "Generate 7-day stability forecast");
  const stability = await callMcpTool(client, "income_stability_tool", {
    worker_id: worker.id,
    days: 7,
  });
  logStep("4c", "Stability forecast", stability);

  logStep("5", "AI agent triggers claim_tool");
  const claimResult = await callMcpTool(client, "claim_tool", {
    action: "create",
    policy_id: policy.policy_id,
    event_type: "weather_disruption",
  });
  const claim = claimResult.claim;
  logStep("5", "Claim created", { claim_id: claim.claim_id, lost_income: claim.lost_income });

  await callMcpTool(client, "claim_tool", {
    action: "update",
    claim_id: claim.claim_id,
    claim_status: "approved",
  });
  logStep("5", "Claim approved", { claim_id: claim.claim_id });

  logStep("6", "fraud_detection_tool verifies claim");
  const fraudCheck = await callMcpTool(client, "fraud_detection_tool", {
    worker_id: worker.id,
    claim_id: claim.claim_id,
  });
  logStep("6", "Fraud score", fraudCheck);

  logStep("7", "Allocate payout from risk pool");
  const joinPool = await callMcpTool(client, "risk_pool_tool", {
    action: "join_pool",
    city: worker.city,
    worker_id: worker.id,
    weekly_contribution: 2500,
  });
  await callMcpTool(client, "risk_pool_tool", {
    action: "collect_weekly_contribution",
    worker_id: worker.id,
  });
  const poolId = joinPool.pool.pool_id;

  const payoutResult = await callMcpTool(client, "risk_pool_tool", {
    action: "allocate_payout",
    pool_id: poolId,
    claim_id: claim.claim_id,
    amount: claim.payout_amount,
  });
  logStep("7", "Payout allocated", payoutResult);

  logStep("8", "Simulate payment");
  const payment = await callMcpTool(client, "payment_tool", {
    worker_id: worker.id,
    amount: claim.payout_amount,
  });
  logStep("8", "Payment sent", payment);

  await pool.end();
  logStep("done", "Simulation complete");
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
