import { query } from "../db/pg.js";
import { callMcpTool } from "../mcp/client.js";
import { getAqiForCity } from "../services/aqiService.js";
import { logger } from "../lib/logger.js";
import { getTrafficForCity } from "../services/trafficService.js";
import { simulateWorkerActivity } from "../services/activityService.js";
import { detectAlgorithmDowntime } from "../services/downtimeService.js";
import { sendWorkerNotification } from "../services/notificationService.js";
import { triggerDowntimeClaim } from "../services/autoClaimService.js";
import { ingestPlatformFeed } from "../services/platformFeedConnector.js";

function estimateRainProbability(rainfallMm = 0, condition = "") {
  const base = Math.min(Math.max((Number(rainfallMm) || 0) / 50, 0), 1);
  const cond = condition.toLowerCase();
  let bonus = 0;
  if (cond.includes("storm")) bonus += 0.3;
  if (cond.includes("rain")) bonus += 0.2;
  return Math.min(base + bonus, 1);
}

async function ingestCity(city) {
  const weather = await callMcpTool("weather_tool", { city });
  const aqi = await getAqiForCity(city);
  const traffic = await getTrafficForCity(city);

  await query(
    `INSERT INTO risk_events (location, event_type, severity, timestamp)
     VALUES ($1, 'aqi', $2, now())`,
    [city, aqi]
  );

  await query(
    `INSERT INTO traffic_events (city, congestion_level, speed_kph, travel_time_index, recorded_at)
     VALUES ($1, $2, $3, $4, now())`,
    [city, traffic.congestion_level, traffic.speed_kph, traffic.travel_time_index]
  );

  const feedResult = await ingestPlatformFeed(city);
  if (!feedResult.activityCount) {
    await simulateWorkerActivity(city, feedResult.zones || []);
  }

  const riskThreshold = Number(process.env.RISK_ALERT_THRESHOLD || 0.7);
  const riskPrediction = await callMcpTool("risk_prediction_tool", {
    city,
    rain_probability: estimateRainProbability(weather.rainfall_mm, weather.weather_condition),
    AQI: aqi,
    temperature: weather.temperature,
  });

    if (riskPrediction.risk_score >= riskThreshold) {
      const { rows: workers } = await query("SELECT id FROM workers WHERE city = $1", [city]);
      for (const worker of workers) {
        await sendWorkerNotification({
          workerId: worker.id,
          type: "risk",
          message: `High disruption risk detected in ${city}. Stay alert and check EarnSure for updates.`,
          dedupeHours: 6,
        });
      }
    }

  logger.info(
    {
      city,
      weather,
      aqi,
      traffic,
      demandSource: feedResult.source,
      demandZones: feedResult.demandCount,
      activity: feedResult.activityCount,
      risk: riskPrediction.risk_score,
    },
    "Risk ingestion completed"
  );
}

export function startRiskScheduler() {
  const enabled = process.env.ENABLE_SCHEDULERS === "true";
  if (!enabled) return;

  const intervalMinutes = Number(process.env.SCHEDULER_INTERVAL_MINUTES || 10);
  const intervalMs = Math.max(intervalMinutes, 1) * 60 * 1000;

  async function run() {
    try {
      const { rows } = await query("SELECT id, city FROM workers");
      const cities = new Set(rows.map((row) => row.city).filter(Boolean));

      for (const city of cities) {
        await ingestCity(city);
      }

      for (const worker of rows) {
        if (!worker.city) continue;
        const downtime = await detectAlgorithmDowntime({ workerId: worker.id, city: worker.city });
        if (downtime?.is_downtime) {
          await sendWorkerNotification({
            workerId: worker.id,
            type: "downtime",
            message: "Algorithm downtime detected. EarnSure is evaluating a parametric payout.",
            dedupeHours: 3,
          });
          await triggerDowntimeClaim({ workerId: worker.id, city: worker.city });
        }
      }
    } catch (err) {
      logger.error({ err }, "Risk scheduler failed");
    }
  }

  run();
  setInterval(run, intervalMs);
  logger.info({ intervalMinutes }, "Risk scheduler started");
}
