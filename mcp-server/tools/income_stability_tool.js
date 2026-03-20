import { query } from "../db/connection.js";

export const definition = {
  name: "income_stability_tool",
  description: "Predict 7-day income stability for a worker using recent earnings, demand, and risk signals.",
  inputSchema: {
    type: "object",
    properties: {
      worker_id: { type: "string" },
      days: { type: "integer", minimum: 3, maximum: 14, default: 7 },
      history_days: { type: "integer", minimum: 14, maximum: 60, default: 28 },
    },
    required: ["worker_id"],
  },
};

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stddev(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

async function getDailyEarnings(workerId, historyDays) {
  const { rows } = await query(
    `SELECT date_trunc('day', recorded_at) AS day, COALESCE(sum(earnings), 0)::numeric AS earnings
     FROM worker_activity
     WHERE worker_id = $1
       AND recorded_at >= now() - ($2::text || ' days')::interval
     GROUP BY day
     ORDER BY day`,
    [workerId, historyDays]
  );

  const map = new Map();
  rows.forEach((row) => {
    const key = new Date(row.day).toISOString().slice(0, 10);
    map.set(key, Number(row.earnings || 0));
  });

  return map;
}

async function getCityForWorker(workerId) {
  const { rows } = await query("SELECT city FROM workers WHERE id = $1", [workerId]);
  return rows[0]?.city;
}

async function getDemandBoost(city) {
  if (!city) return 1;
  const { rows } = await query(
    `SELECT avg(demand_index)::numeric AS avg_demand
     FROM platform_demand
     WHERE city = $1
       AND recorded_at >= now() - interval '24 hours'`,
    [city]
  );
  const avgDemand = Number(rows[0]?.avg_demand || 0);
  if (!avgDemand) return 1;
  return Math.min(1.4, Math.max(0.8, avgDemand / 25));
}

async function getRiskAdjustment(city) {
  if (!city) return 1;
  const { rows } = await query(
    `SELECT avg(severity)::numeric AS avg_severity
     FROM risk_events
     WHERE location = $1
       AND timestamp >= now() - interval '24 hours'`,
    [city]
  );
  const { rows: trafficRows } = await query(
    `SELECT avg(congestion_level)::numeric AS avg_congestion
     FROM traffic_events
     WHERE city = $1
       AND recorded_at >= now() - interval '24 hours'`,
    [city]
  );
  const severity = Number(rows[0]?.avg_severity || 0);
  const trafficSeverity = Number(trafficRows[0]?.avg_congestion || 0) / 100;
  const blended = Math.min(1, severity * 0.7 + trafficSeverity * 0.3);
  if (!blended) return 1;
  return Math.max(0.75, 1 - blended * 0.2);
}

export async function handler({ worker_id, days = 7, history_days = 28 }) {
  const historyMap = await getDailyEarnings(worker_id, history_days);
  const today = new Date();
  const values = [];
  const dowBuckets = Array.from({ length: 7 }, () => []);

  for (let i = history_days; i >= 1; i -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = formatDate(date);
    const earnings = historyMap.get(key) ?? 0;
    values.push(earnings);
    dowBuckets[date.getDay()].push(earnings);
  }

  const avg = mean(values) || 600;
  const std = stddev(values);
  const stability_score = Number(Math.max(0, Math.min(1, 1 - std / (avg + 1))).toFixed(2));

  const city = await getCityForWorker(worker_id);
  const demandBoost = await getDemandBoost(city);
  const riskAdjustment = await getRiskAdjustment(city);

  const forecast = [];
  for (let i = 1; i <= days; i += 1) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dowValues = dowBuckets[date.getDay()];
    const dowAvg = dowValues.length ? mean(dowValues) : avg;
    const expected_income = Number((dowAvg * demandBoost * riskAdjustment).toFixed(2));
    forecast.push({
      date: formatDate(date),
      expected_income,
    });
  }

  const recommendations = [];
  if (stability_score < 0.5) {
    recommendations.push("Shift to peak lunch or dinner hours to stabilize earnings.");
  }
  if (demandBoost < 0.95) {
    recommendations.push("Consider high-demand zones suggested in your dashboard.");
  }
  if (riskAdjustment < 0.9) {
    recommendations.push("Weather or AQI risk is elevated—keep safety buffers and watch alerts.");
  }
  if (!recommendations.length) {
    recommendations.push("Your earnings outlook looks stable for the next 7 days.");
  }

  return {
    worker_id,
    stability_score,
    demand_boost: Number(demandBoost.toFixed(2)),
    risk_adjustment: Number(riskAdjustment.toFixed(2)),
    forecast,
    recommendations,
  };
}
