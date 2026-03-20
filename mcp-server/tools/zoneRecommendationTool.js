export const definition = {
  name: "zone_recommendation_tool",
  description: "Suggest high-demand delivery zones to workers.",
  inputSchema: {
    type: "object",
    properties: {
      worker_location: { type: "string" },
      zone_demand: {
        type: "array",
        items: {
          type: "object",
          properties: {
            zone: { type: "string" },
            demand_level: { type: "number" },
            distance_km: { type: "number" },
          },
          required: ["zone", "demand_level"],
        },
      },
      weather_conditions: {
        type: "object",
        properties: {
          rainfall_mm: { type: "number" },
          temperature: { type: "number" },
          weather_condition: { type: "string" },
        },
      },
    },
    required: ["worker_location", "zone_demand"],
  },
};

function weatherPenalty(weather = {}) {
  const rain = Number(weather.rainfall_mm ?? 0);
  const condition = (weather.weather_condition || "").toLowerCase();

  let penalty = 0;
  if (rain >= 10) penalty += 0.15;
  if (rain >= 25) penalty += 0.3;
  if (condition.includes("storm") || condition.includes("heavy")) penalty += 0.2;
  return Math.min(penalty, 0.5);
}

export async function handler({ worker_location, zone_demand, weather_conditions }) {
  if (!Array.isArray(zone_demand) || zone_demand.length === 0) {
    throw new Error("zone_demand must be a non-empty array.");
  }

  const penalty = weatherPenalty(weather_conditions);

  const scored = zone_demand.map((zone) => {
    const demand = Number(zone.demand_level ?? 0);
    const distance = Number(zone.distance_km ?? 0);
    const distancePenalty = distance > 0 ? Math.min(distance / 50, 0.3) : 0;
    const score = Math.max(demand * (1 - penalty - distancePenalty), 0);
    return { ...zone, expected_order_density: score };
  });

  scored.sort((a, b) => b.expected_order_density - a.expected_order_density);
  const best = scored[0];

  return {
    recommended_zone: best.zone,
    expected_order_density: best.expected_order_density,
    worker_location,
  };
}
