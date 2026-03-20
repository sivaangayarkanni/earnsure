const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");
const { callMcpTool } = require("../utils/mcpClient");
const { AppError } = require("../utils/errors");

const router = express.Router();

// POST /mcp/weather — fetch live weather for a city
router.post("/weather", asyncHandler(async (req, res) => {
  const { city } = req.body;
  if (!city) throw new AppError("city is required", 400);
  const result = await callMcpTool("weather_tool", { city });
  res.json({ data: result });
}));

// POST /mcp/risk — predict risk score + premium
router.post("/risk", asyncHandler(async (req, res) => {
  const { city, rain_probability, AQI, temperature } = req.body;
  if (!city) throw new AppError("city is required", 400);
  const result = await callMcpTool("risk_prediction_tool", {
    city,
    rain_probability: Number(rain_probability) || 0,
    AQI: Number(AQI) || 100,
    temperature: Number(temperature) || 28,
  });
  res.json({ data: result });
}));

// POST /mcp/claim — create/update/get claim
router.post("/claim", asyncHandler(async (req, res) => {
  const { action, policy_id, event_type, claim_id, claim_status } = req.body;
  if (!action) throw new AppError("action is required", 400);
  const result = await callMcpTool("claim_tool", { action, policy_id, event_type, claim_id, claim_status });
  res.json({ data: result });
}));

// POST /mcp/fraud — evaluate fraud for a claim
router.post("/fraud", asyncHandler(async (req, res) => {
  const { worker_id, claim_id } = req.body;
  if (!worker_id || !claim_id) throw new AppError("worker_id and claim_id required", 400);
  const result = await callMcpTool("fraud_detection_tool", { worker_id, claim_id });
  res.json({ data: result });
}));

// POST /mcp/pool — pool operations
router.post("/pool", asyncHandler(async (req, res) => {
  const { action, city, pool_id, worker_id, weekly_contribution, claim_id, amount } = req.body;
  if (!action) throw new AppError("action is required", 400);
  const result = await callMcpTool("pool_tool", { action, city, pool_id, worker_id, weekly_contribution, claim_id, amount });
  res.json({ data: result });
}));

// POST /mcp/payment — simulate UPI payout
router.post("/payment", asyncHandler(async (req, res) => {
  const { worker_id, amount } = req.body;
  if (!worker_id || !amount) throw new AppError("worker_id and amount required", 400);
  const result = await callMcpTool("payment_tool", { worker_id, amount: Number(amount) });
  res.json({ data: result });
}));

// POST /mcp/zones — zone recommendations
router.post("/zones", asyncHandler(async (req, res) => {
  const { city, limit } = req.body;
  if (!city) throw new AppError("city is required", 400);
  const result = await callMcpTool("zone_recommendation_tool", { city, limit: limit || 4 });
  res.json({ data: result });
}));

// POST /mcp/algorithm — detect algorithm downtime
router.post("/algorithm", asyncHandler(async (req, res) => {
  const { worker_id, city, zone, online_status, orders_received, expected_orders } = req.body;
  if (!worker_id || !city) throw new AppError("worker_id and city are required", 400);
  if (online_status === undefined || !orders_received) throw new AppError("online_status and orders_received are required", 400);
  const result = await callMcpTool("algorithm_downtime_tool", { 
    worker_id, city, zone, online_status, orders_received, expected_orders 
  });
  res.json({ data: result });
}));

// POST /mcp/orchestrate — full insurance flow: weather → risk → claim → fraud → payout
router.post("/orchestrate", asyncHandler(async (req, res) => {
  const { city, worker_id, policy_id, pool_id } = req.body;
  if (!city || !worker_id || !policy_id || !pool_id) {
    throw new AppError("city, worker_id, policy_id, pool_id required", 400);
  }

  // Step 1: Fetch live weather via MCP
  const weather = await callMcpTool("weather_tool", { city });

  // Step 2: Predict risk via AI engine via MCP
  const rainProb = Math.min((weather.rainfall_mm || 0) / 50, 1);
  const riskResult = await callMcpTool("risk_prediction_tool", {
    city,
    rain_probability: rainProb,
    AQI: req.body.AQI || 120,
    temperature: weather.temperature || 28,
  });

  // Step 3: Decide if claim should trigger
  const shouldTrigger = (weather.rainfall_mm || 0) > 20 ||
    riskResult.risk_score >= 0.6 ||
    (weather.temperature || 0) > 42;

  let claim = null, fraudCheck = null, payment = null;

  if (shouldTrigger) {
    // Step 4: Create claim via MCP
    const claimResult = await callMcpTool("claim_tool", {
      action: "create",
      policy_id,
      event_type: (weather.rainfall_mm || 0) > 20 ? "heavy_rain" :
                  (weather.temperature || 0) > 42 ? "heatwave" : "weather_disruption",
    });
    claim = claimResult.claim;

    if (claim?.claim_id) {
      // Step 5: Fraud check via MCP
      fraudCheck = await callMcpTool("fraud_detection_tool", { worker_id, claim_id: claim.claim_id });

      if (!fraudCheck.flagged) {
        // Step 6: Approve claim
        await callMcpTool("claim_tool", { action: "update", claim_id: claim.claim_id, claim_status: "approved" });

        // Step 7: Allocate payout from pool
        const payoutAmount = Number(claim.payout_amount || riskResult.recommended_weekly_premium || 360);
        try {
          await callMcpTool("pool_tool", { action: "allocate_payout", pool_id, claim_id: claim.claim_id, amount: payoutAmount });
        } catch (_) { /* pool may be empty in demo */ }

        // Step 8: Process UPI payment
        payment = await callMcpTool("payment_tool", { worker_id, amount: payoutAmount });
      }
    }
  }

  res.json({
    data: {
      weather,
      risk: riskResult,
      triggered: shouldTrigger,
      claim,
      fraud_check: fraudCheck,
      payment,
    },
  });
}));

module.exports = { mcpRouter: router };
