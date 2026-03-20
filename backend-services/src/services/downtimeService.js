import { query } from "../db/pg.js";
import { logger } from "../lib/logger.js";

const DEFAULT_WINDOW_MINUTES = 60;
const DOWNTIME_THRESHOLD = Number(process.env.DOWNTIME_DROP_THRESHOLD || 50);

async function getLatestActivity(workerId, windowMinutes) {
  const { rows } = await query(
    `SELECT zone,
            bool_or(online_status) AS online_status,
            COALESCE(sum(orders_received), 0)::int AS orders_received
     FROM worker_activity
     WHERE worker_id = $1
       AND recorded_at >= now() - ($2::text || ' minutes')::interval
     GROUP BY zone
     ORDER BY max(recorded_at) DESC
     LIMIT 1`,
    [workerId, windowMinutes]
  );
  return rows[0] || null;
}

async function getExpectedOrders(city, zone, windowMinutes) {
  const { rows } = await query(
    `SELECT orders_per_hour, demand_index
     FROM platform_demand
     WHERE city = $1 AND zone = $2
     ORDER BY recorded_at DESC
     LIMIT 1`,
    [city, zone]
  );
  let demand = rows[0];
  const windowHours = windowMinutes / 60;
  if (!demand && !zone) {
    const { rows: cityRows } = await query(
      `SELECT avg(orders_per_hour)::numeric AS orders_per_hour, avg(demand_index)::numeric AS demand_index
       FROM platform_demand
       WHERE city = $1
         AND recorded_at >= now() - interval '6 hours'`,
      [city]
    );
    demand = cityRows[0];
  }
  if (demand?.orders_per_hour) {
    return Math.max(1, Math.round(Number(demand.orders_per_hour) * windowHours));
  }

  let fallbackDemand = null;
  if (zone) {
    const { rows: zoneRows } = await query(
      `SELECT demand_level
       FROM zone_demand
       WHERE city = $1 AND zone = $2
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [city, zone]
    );
    fallbackDemand = Number(zoneRows[0]?.demand_level || 0);
  }
  if (!fallbackDemand) {
    const { rows: cityDemand } = await query(
      `SELECT avg(demand_level)::numeric AS demand_level
       FROM zone_demand
       WHERE city = $1
         AND recorded_at >= now() - interval '6 hours'`,
      [city]
    );
    fallbackDemand = Number(cityDemand[0]?.demand_level || 12);
  }
  return Math.max(1, Math.round((fallbackDemand / 3) * windowHours));
}

export async function detectAlgorithmDowntime({ workerId, city, windowMinutes = DEFAULT_WINDOW_MINUTES }) {
  const activity = await getLatestActivity(workerId, windowMinutes);
  if (!activity) {
    return null;
  }

  const zone = activity.zone || null;
  const orders_received = Number(activity.orders_received || 0);
  const expected_orders = await getExpectedOrders(city, zone, windowMinutes);

  const order_drop_percentage =
    expected_orders > 0 ? ((expected_orders - orders_received) / expected_orders) * 100 : 0;
  const online_status = Boolean(activity.online_status);
  const is_downtime = online_status && order_drop_percentage >= DOWNTIME_THRESHOLD;

  await query(
    `INSERT INTO algorithm_events
     (worker_id, city, zone, online_status, orders_received, expected_orders, order_drop_percentage, is_downtime)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      workerId,
      city,
      zone,
      online_status,
      orders_received,
      expected_orders,
      order_drop_percentage,
      is_downtime,
    ]
  );

  if (is_downtime) {
    await query(
      `INSERT INTO risk_events (location, event_type, severity, timestamp)
       VALUES ($1, 'algorithm_downtime', $2, now())`,
      [city, Math.min(order_drop_percentage / 100, 1)]
    );
  }

  logger.info({ workerId, city, zone, order_drop_percentage, is_downtime }, "Downtime detection complete");
  return {
    worker_id: workerId,
    city,
    zone,
    online_status,
    orders_received,
    expected_orders,
    order_drop_percentage: Number(order_drop_percentage.toFixed(2)),
    is_downtime,
  };
}
