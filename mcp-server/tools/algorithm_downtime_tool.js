import { query } from "../db/connection.js";

export const definition = {
  name: "algorithm_downtime_tool",
  description: "Detect algorithm downtime by comparing worker activity with zone demand. Triggers claims when worker is online but receiving significantly fewer orders than expected.",
  inputSchema: {
    type: "object",
    properties: {
      worker_id: { type: "string", description: "Worker ID to check" },
      city: { type: "string", description: "City name" },
      zone: { type: "string", description: "Zone name (optional)" },
      online_status: { type: "boolean", description: "Whether worker is online" },
      orders_received: { type: "integer", description: "Number of orders received in last hour" },
      expected_orders: { type: "integer", description: "Expected orders for this zone/time", default: 10 },
      window_minutes: { type: "integer", description: "Time window in minutes for activity check", default: 60 },
    },
    required: ["worker_id", "city"],
  },
};

async function getLatestActivity(worker_id, window_minutes) {
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
    [worker_id, window_minutes]
  );
  return rows[0] || null;
}

async function estimateExpectedOrders(city, zone, window_minutes) {
  const windowHours = window_minutes / 60;
  let demand = null;
  if (zone) {
    const { rows } = await query(
      `SELECT orders_per_hour, demand_index
       FROM platform_demand
       WHERE city = $1 AND zone = $2
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [city, zone]
    );
    demand = rows[0];
  }
  if (!demand) {
    const { rows } = await query(
      `SELECT avg(orders_per_hour)::numeric AS orders_per_hour, avg(demand_index)::numeric AS demand_index
       FROM platform_demand
       WHERE city = $1
       AND recorded_at >= now() - interval '6 hours'`,
      [city]
    );
    demand = rows[0];
  }
  if (demand?.orders_per_hour) {
    return Math.max(1, Math.round(Number(demand.orders_per_hour) * windowHours));
  }
  let fallbackDemand = null;
  if (zone) {
    const { rows: fallbackRows } = await query(
      `SELECT demand_level
       FROM zone_demand
       WHERE city = $1 AND zone = $2
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [city, zone]
    );
    fallbackDemand = Number(fallbackRows[0]?.demand_level || 0);
  }
  if (!fallbackDemand) {
    const { rows } = await query(
      `SELECT avg(demand_level)::numeric AS demand_level
       FROM zone_demand
       WHERE city = $1
       AND recorded_at >= now() - interval '6 hours'`,
      [city]
    );
    fallbackDemand = Number(rows[0]?.demand_level || 12);
  }
  return Math.max(1, Math.round((fallbackDemand / 3) * windowHours));
}

export async function handler({
  worker_id,
  city,
  zone,
  online_status,
  orders_received,
  expected_orders,
  window_minutes = 60,
}) {
  let activity = null;
  if (orders_received == null || online_status == null || !zone) {
    activity = await getLatestActivity(worker_id, window_minutes);
  }

  const resolvedZone = zone || activity?.zone || null;
  const resolvedOnline = online_status ?? activity?.online_status ?? false;
  const resolvedOrders = orders_received ?? activity?.orders_received ?? 0;
  const resolvedExpected =
    expected_orders ?? (await estimateExpectedOrders(city, resolvedZone, window_minutes));

  // Calculate order drop percentage
  const order_drop_percentage = resolvedExpected > 0 
    ? ((resolvedExpected - resolvedOrders) / resolvedExpected) * 100 
    : 0;

  // Determine if this is algorithm downtime
  // Conditions: worker is online, orders dropped > 50%, zone demand is NOT low
  const is_downtime = resolvedOnline && order_drop_percentage > 50;

  // Get zone demand from zone_demand table
  let zone_demand_level = null;
  try {
    if (resolvedZone) {
      const { rows } = await query(
        `SELECT demand_level FROM zone_demand 
         WHERE city = $1 AND zone = $2 
         ORDER BY recorded_at DESC LIMIT 1`,
        [city, resolvedZone]
      );
      zone_demand_level = rows[0]?.demand_level;
    } else {
      const { rows } = await query(
        `SELECT avg(demand_level)::numeric AS demand_level
         FROM zone_demand
         WHERE city = $1
         AND recorded_at >= now() - interval '6 hours'`,
        [city]
      );
      zone_demand_level = rows[0]?.demand_level;
    }
  } catch (e) {
    // Table might not have data
  }

  // Record this event
  try {
    await query(
      `INSERT INTO algorithm_events 
       (worker_id, city, zone, online_status, orders_received, expected_orders, order_drop_percentage, is_downtime)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [worker_id, city, resolvedZone, resolvedOnline, resolvedOrders, resolvedExpected, order_drop_percentage, is_downtime]
    );
  } catch (e) {
    // Table might not exist yet
  }

  return {
    worker_id,
    city,
    zone: resolvedZone,
    online_status: resolvedOnline,
    orders_received: resolvedOrders,
    expected_orders: resolvedExpected,
    order_drop_percentage: Math.round(order_drop_percentage * 100) / 100,
    zone_demand_level,
    is_downtime,
    will_trigger_claim: is_downtime && (zone_demand_level === null || zone_demand_level > 30),
    message: is_downtime 
      ? "Algorithm downtime detected - worker online but orders significantly below expected"
      : "Normal activity - no algorithm issue detected"
  };
}
