import { Router } from "express";
import { query } from "../db/pg.js";
import { callMcpTool } from "../mcp/client.js";
import { getAqiForCity } from "../services/aqiService.js";
import { updateWorkerProfile } from "../services/workerService.js";
import { listWorkerNotifications } from "../services/notificationService.js";
import { z } from "zod";

const router = Router();

function estimateRainProbability(rainfallMm, condition = "") {
  const base = Math.min(Math.max((Number(rainfallMm) || 0) / 50, 0), 1);
  const cond = condition.toLowerCase();
  let bonus = 0;
  if (cond.includes("storm")) bonus += 0.3;
  if (cond.includes("rain")) bonus += 0.2;
  return Math.min(base + bonus, 1);
}

router.get("/profile", async (req, res, next) => {
  try {
    const { worker_id } = req.user;
    const { rows } = await query(
      "SELECT id, name, phone, city, platform, risk_score, upi_id FROM workers WHERE id = $1",
      [worker_id]
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Worker not found" });
      return;
    }
    res.json({ worker: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.patch("/profile", async (req, res, next) => {
  try {
    const schema = z.object({ upi_id: z.string().min(3) });
    const payload = schema.parse(req.body);
    const worker = await updateWorkerProfile({ worker_id: req.user.worker_id, upi_id: payload.upi_id });
    res.json({ worker });
  } catch (err) {
    next(err);
  }
});

router.get("/policy", async (req, res, next) => {
  try {
    const { worker_id } = req.user;
    const { rows } = await query(
      `SELECT * FROM policies
       WHERE worker_id = $1 AND status = 'active'
       ORDER BY start_date DESC
       LIMIT 1`,
      [worker_id]
    );
    res.json({ policy: rows[0] || null });
  } catch (err) {
    next(err);
  }
});

router.get("/claims", async (req, res, next) => {
  try {
    const { worker_id } = req.user;
    const { rows } = await query(
      `SELECT c.*
       FROM claims c
       JOIN policies p ON c.policy_id = p.policy_id
       WHERE p.worker_id = $1
       ORDER BY c.created_at DESC`,
      [worker_id]
    );
    res.json({ claims: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/alerts", async (req, res, next) => {
  try {
    const { worker_id } = req.user;
    const { rows } = await query("SELECT city FROM workers WHERE id = $1", [worker_id]);
    const city = rows[0]?.city;
    if (!city) {
      res.status(404).json({ error: "Worker city not found" });
      return;
    }

    const { rows: activityRows } = await query(
      `SELECT zone, online_status, orders_received
       FROM worker_activity
       WHERE worker_id = $1
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [worker_id]
    );
    const activity = activityRows[0] || {};

    const weather = await callMcpTool("weather_tool", { city });
    const aqi = await getAqiForCity(city);

    const rainProbability = estimateRainProbability(
      weather.rainfall_mm,
      weather.weather_condition
    );

    const riskPrediction = await callMcpTool("risk_prediction_tool", {
      city,
      rain_probability: rainProbability,
      AQI: aqi,
      temperature: weather.temperature,
    });

    const downtime = await callMcpTool("algorithm_downtime_tool", {
      worker_id,
      city,
      zone: activity.zone,
      online_status: activity.online_status ?? false,
      orders_received: activity.orders_received ?? 0,
      window_minutes: 60,
    });

    const { rows: trafficRows } = await query(
      `SELECT congestion_level, speed_kph, travel_time_index, recorded_at
       FROM traffic_events
       WHERE city = $1
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [city]
    );

    const { rows: demandRows } = await query(
      `SELECT zone, demand_index, orders_per_hour, active_workers, recorded_at
       FROM platform_demand
       WHERE city = $1
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [city]
    );

    res.json({
      weather,
      aqi,
      risk_score: riskPrediction.risk_score,
      recommended_weekly_premium: riskPrediction.recommended_weekly_premium,
      premium_breakdown: riskPrediction.premium_breakdown,
      traffic: trafficRows[0] || null,
      platform_demand: demandRows[0] || null,
      algorithm_downtime: downtime,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/zones", async (req, res, next) => {
  try {
    const { worker_id } = req.user;
    const { rows } = await query("SELECT city FROM workers WHERE id = $1", [worker_id]);
    const city = rows[0]?.city;
    if (!city) {
      res.status(404).json({ error: "Worker city not found" });
      return;
    }
    const result = await callMcpTool("zone_recommendation_tool", { city, limit: 4 });
    res.json({ zones: result });
  } catch (err) {
    next(err);
  }
});

router.get("/notifications", async (req, res, next) => {
  try {
    const items = await listWorkerNotifications(req.user.worker_id, 15);
    res.json({ notifications: items });
  } catch (err) {
    next(err);
  }
});

router.get("/stability", async (req, res, next) => {
  try {
    const { worker_id } = req.user;
    const stability = await callMcpTool("income_stability_tool", { worker_id, days: 7 });
    res.json(stability);
  } catch (err) {
    next(err);
  }
});

router.get("/premium-breakdown", async (req, res, next) => {
  try {
    const { worker_id } = req.user;
    const { rows } = await query("SELECT city FROM workers WHERE id = $1", [worker_id]);
    const city = rows[0]?.city;
    if (!city) {
      res.status(404).json({ error: "Worker city not found" });
      return;
    }
    const weather = await callMcpTool("weather_tool", { city });
    const aqi = await getAqiForCity(city);
    const rainProbability = estimateRainProbability(
      weather.rainfall_mm,
      weather.weather_condition
    );
    const riskPrediction = await callMcpTool("risk_prediction_tool", {
      city,
      rain_probability: rainProbability,
      AQI: aqi,
      temperature: weather.temperature,
    });
    res.json({
      risk_score: riskPrediction.risk_score,
      recommended_weekly_premium: riskPrediction.recommended_weekly_premium,
      premium_breakdown: riskPrediction.premium_breakdown,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
