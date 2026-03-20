import { query } from "../db/connection.js";

export const definition = {
  name: "zone_recommendation_tool",
  description: "Analyze zone demand and suggest high-demand delivery areas.",
  inputSchema: {
    type: "object",
    properties: {
      city: { type: "string" },
      limit: { type: "integer", minimum: 1, maximum: 10, default: 3 },
    },
    required: ["city"],
  },
};

export async function handler({ city, limit = 3 }) {
  const safeLimit = Math.min(Math.max(Number(limit) || 3, 1), 10);
  let { rows } = await query(
    `SELECT zone, demand_index AS demand_level, recorded_at
     FROM platform_demand
     WHERE city = $1
     ORDER BY demand_index DESC, recorded_at DESC
     LIMIT $2`,
    [city, safeLimit]
  );

  if (!rows.length) {
    const fallback = await query(
      `SELECT zone, demand_level, recorded_at
       FROM zone_demand
       WHERE city = $1
       ORDER BY demand_level DESC, recorded_at DESC
       LIMIT $2`,
      [city, safeLimit]
    );
    rows = fallback.rows;
  }

  const best = rows[0];
  if (!best) {
    return { recommended_zone: null, expected_order_density: 0 };
  }

  return {
    recommended_zone: best.zone,
    expected_order_density: Number(best.demand_level),
  };
}
