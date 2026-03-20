import { logger } from "../lib/logger.js";

const demandUrl = () => process.env.PLATFORM_DEMAND_URL;
const demandToken = () => process.env.PLATFORM_DEMAND_TOKEN;

const defaultZonesByCity = {
  Bengaluru: ["Indiranagar", "Koramangala", "HSR", "Whitefield", "MG Road"],
  Chennai: ["Anna Nagar", "T Nagar", "Adyar", "Velachery", "OMR"],
  Hyderabad: ["Gachibowli", "Hitech City", "Banjara Hills", "Kukatpally", "Madhapur"],
  Mumbai: ["Bandra", "Andheri", "Powai", "Lower Parel", "Dadar"],
  Delhi: ["Connaught Place", "Saket", "Dwarka", "Karol Bagh", "Noida"],
};

function getZones(city) {
  const envZones = (process.env.DEMAND_ZONES || "")
    .split(",")
    .map((zone) => zone.trim())
    .filter(Boolean);
  if (envZones.length) return envZones;
  return defaultZonesByCity[city] || ["Central", "North", "East", "South", "West"];
}

function getDemandMultiplier() {
  const hour = new Date().getHours();
  if (hour >= 11 && hour <= 14) return 1.35;
  if (hour >= 18 && hour <= 22) return 1.5;
  if (hour >= 7 && hour <= 9) return 1.15;
  return 0.9;
}

function simulateDemand(city) {
  const zones = getZones(city);
  const multiplier = getDemandMultiplier();
  const base = 18 + Math.random() * 8;
  return {
    city,
    source: "simulated",
    zones: zones.map((zone) => {
      const jitter = 0.8 + Math.random() * 0.6;
      const demand_index = Number((base * multiplier * jitter).toFixed(2));
      const orders_per_hour = Number((demand_index * 0.7).toFixed(2));
      const active_workers = Math.max(4, Math.round(demand_index / 4));
      return { zone, demand_index, orders_per_hour, active_workers };
    }),
  };
}

export async function getPlatformDemand(city) {
  if (!demandUrl()) {
    return simulateDemand(city);
  }

  const url = new URL(demandUrl());
  url.searchParams.set("city", city);
  const response = await fetch(url, {
    headers: demandToken() ? { Authorization: `Bearer ${demandToken()}` } : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    logger.warn({ city, text }, "Platform demand API failed, using simulation");
    return simulateDemand(city);
  }

  const data = await response.json();
  if (!Array.isArray(data?.zones)) {
    logger.warn({ city }, "Platform demand response invalid, using simulation");
    return simulateDemand(city);
  }

  const zones = data.zones.map((entry) => ({
    zone: entry.zone || entry.name || entry.area || "Central",
    demand_index: Number(entry.demand_index || entry.demand || 0),
    orders_per_hour: Number(entry.orders_per_hour || entry.ordersPerHour || 0),
    active_workers: Number(entry.active_workers || entry.activeWorkers || 0),
  }));

  return { city, source: "api", zones };
}
