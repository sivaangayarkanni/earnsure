import { query } from "../db/pg.js";
import { logger } from "../lib/logger.js";

const AVG_ORDER_VALUE = Number(process.env.AVG_ORDER_VALUE || 65);

function pickZoneForWorker(worker, zones) {
  if (!zones.length) return null;
  const randomIndex = Math.floor(Math.random() * zones.length);
  const entry = zones[randomIndex];
  if (!entry) return null;
  return entry.zone || entry.name || entry.area || entry || null;
}

export async function simulateWorkerActivity(city, demandZones) {
  const enabled = process.env.SIMULATE_ACTIVITY !== "false";
  if (!enabled) return;

  const { rows: workers } = await query("SELECT id FROM workers WHERE city = $1", [city]);
  if (!workers.length) return;

  for (const worker of workers) {
    const zone = pickZoneForWorker(worker, demandZones);
    const demand = demandZones.find(
      (entry) => entry.zone === zone || entry.name === zone || entry.area === zone
    );
    const expectedOrders = Number(demand?.orders_per_hour || 8);
    const variance = 0.6 + Math.random() * 0.7;
    const orders_received = Math.max(0, Math.round(expectedOrders * variance));
    const orders_accepted = Math.max(0, Math.round(orders_received * (0.7 + Math.random() * 0.2)));
    const earnings = Number((orders_accepted * AVG_ORDER_VALUE).toFixed(2));

    await query(
      `INSERT INTO worker_activity
       (worker_id, city, zone, online_status, orders_received, orders_accepted, earnings)
       VALUES ($1, $2, $3, true, $4, $5, $6)`,
      [worker.id, city, zone, orders_received, orders_accepted, earnings]
    );
  }

  logger.info({ city, workers: workers.length }, "Simulated worker activity");
}
