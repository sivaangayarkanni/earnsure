import dotenv from "dotenv";
import { connectMcpClient, callTool } from "./mcpClient.js";

dotenv.config();

function parseInput() {
  const raw = process.argv.slice(2).join(" ");
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error("Input must be valid JSON.");
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function estimateRainProbability(rainfallMm, condition = "") {
  const base = clamp((Number(rainfallMm) || 0) / 50, 0, 1);
  const cond = condition.toLowerCase();
  let bonus = 0;
  if (cond.includes("storm")) bonus += 0.3;
  if (cond.includes("rain")) bonus += 0.2;
  return clamp(base + bonus, 0, 1);
}

function evaluateDisruptionRisk(weather) {
  const rainfall = Number(weather?.rainfall_mm ?? 0);
  const condition = (weather?.weather_condition || "").toLowerCase();
  const temperature = Number(weather?.temperature ?? 0);

  let score = 0;
  if (rainfall >= 10) score += 0.3;
  if (rainfall >= 25) score += 0.3;
  if (condition.includes("storm") || condition.includes("heavy")) score += 0.3;
  if (temperature >= 40 || temperature <= 5) score += 0.2;

  return clamp(score, 0, 1);
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
  const input = parseInput();
  if (!input) {
    console.log(
      "Usage: node src/orchestrator.js '{" +
        "\"city\":\"Bengaluru\",\"worker_id\":\"...\",\"policy_id\":\"...\",\"pool_id\":\"...\",\"claim_amount\":500}'"
    );
    return;
  }

  const {
    city,
    worker_id,
    policy_id,
    pool_id,
    claim_amount,
    rain_probability,
    AQI,
    temperature,
  } = input;

  if (!city || !worker_id || !policy_id || !pool_id) {
    throw new Error("city, worker_id, policy_id, and pool_id are required.");
  }

  const client = await connectMcpClient();

  const weather = await callMcpTool(client, "weather_tool", { city });
  const disruptionRisk = evaluateDisruptionRisk(weather);

  const effectiveRainProbability =
    rain_probability ?? estimateRainProbability(weather.rainfall_mm, weather.weather_condition);
  const effectiveAQI = AQI ?? 120;
  const effectiveTemp = temperature ?? weather.temperature ?? 25;

  const riskPrediction = await callMcpTool(client, "risk_prediction_tool", {
    city,
    rain_probability: effectiveRainProbability,
    AQI: effectiveAQI,
    temperature: effectiveTemp,
  });

  const shouldTriggerClaim = disruptionRisk >= 0.5 || riskPrediction.risk_score >= 0.6;

  let claim = null;
  let fraudCheck = null;
  let payout = null;
  let payment = null;

  if (shouldTriggerClaim) {
    const claimCreate = await callMcpTool(client, "claim_tool", {
      action: "create",
      policy_id,
      event_type: "weather_disruption",
    });
    claim = claimCreate.claim;

    if (claim?.claim_id) {
      await callMcpTool(client, "claim_tool", {
        action: "update",
        claim_id: claim.claim_id,
        claim_status: "approved",
      });
      claim.claim_status = "approved";
    }

    fraudCheck = await callMcpTool(client, "fraud_detection_tool", {
      worker_id,
      claim_id: claim.claim_id,
    });

    if (!fraudCheck.flagged) {
      const payoutAmount = Number(
        claim_amount ?? riskPrediction.recommended_weekly_premium ?? 0
      );
      if (payoutAmount <= 0) {
        throw new Error("payout amount must be greater than zero.");
      }

      payout = await callMcpTool(client, "risk_pool_tool", {
        action: "allocate_payout",
        pool_id,
        claim_id: claim.claim_id,
        amount: payoutAmount,
      });

      payment = await callMcpTool(client, "payment_tool", {
        worker_id,
        amount: payoutAmount,
      });
    }
  }

  const output = {
    weather,
    disruption_risk: disruptionRisk,
    risk_prediction: riskPrediction,
    claim_triggered: shouldTriggerClaim,
    claim,
    fraud_check: fraudCheck,
    payout,
    payment,
  };

  console.log(JSON.stringify(output, null, 2));
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
