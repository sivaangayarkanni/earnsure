import { Router } from "express";
import { callMcpTool } from "../mcp/client.js";

const router = Router();

router.post("/weather", async (req, res, next) => {
  try {
    const result = await callMcpTool("weather_tool", req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/risk", async (req, res, next) => {
  try {
    const result = await callMcpTool("risk_prediction_tool", req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/claim", async (req, res, next) => {
  try {
    const result = await callMcpTool("claim_tool", req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/fraud", async (req, res, next) => {
  try {
    const result = await callMcpTool("fraud_detection_tool", req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/pool", async (req, res, next) => {
  try {
    const result = await callMcpTool("risk_pool_tool", req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/payment", async (req, res, next) => {
  try {
    const result = await callMcpTool("payment_tool", req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/zones", async (req, res, next) => {
  try {
    const result = await callMcpTool("zone_recommendation_tool", req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/downtime", async (req, res, next) => {
  try {
    const result = await callMcpTool("algorithm_downtime_tool", req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/stability", async (req, res, next) => {
  try {
    const result = await callMcpTool("income_stability_tool", req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/orchestrate", async (req, res, next) => {
  try {
    const { city, worker_id, policy_id, pool_id, AQI } = req.body;
    const weather = await callMcpTool("weather_tool", { city });
    const riskPrediction = await callMcpTool("risk_prediction_tool", {
      city,
      rain_probability: 0.5,
      AQI: AQI || 100,
      temperature: weather.temperature,
    });
    const claimResult = await callMcpTool("claim_tool", {
      action: "create",
      policy_id,
      event_type: "weather_disruption",
    });

    await callMcpTool("claim_tool", {
      action: "update",
      claim_id: claimResult.claim.claim_id,
      claim_status: "approved",
    });

    const fraud = await callMcpTool("fraud_detection_tool", {
      worker_id,
      claim_id: claimResult.claim.claim_id,
    });

    let payout = null;
    let payment = null;
    if (fraud.fraud_score < 0.6) {
      payout = await callMcpTool("risk_pool_tool", {
        action: "allocate_payout",
        pool_id,
        claim_id: claimResult.claim.claim_id,
        amount: claimResult.claim.payout_amount,
      });
      payment = await callMcpTool("payment_tool", {
        worker_id,
        amount: claimResult.claim.payout_amount,
      });
    }

    res.json({ weather, riskPrediction, claim: claimResult.claim, fraud, payout, payment });
  } catch (err) {
    next(err);
  }
});

export default router;
