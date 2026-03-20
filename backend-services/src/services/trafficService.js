import { logger } from "../lib/logger.js";
import { getCityCoordinates } from "./aqiService.js";

const apiKey = () => process.env.TRAFFIC_API_KEY;
const flowUrl = () =>
  process.env.TRAFFIC_FLOW_URL ||
  "https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json";

function simulateTraffic(city) {
  const hour = new Date().getHours();
  const peak = hour >= 8 && hour <= 11 || hour >= 18 && hour <= 21;
  const base = peak ? 0.65 : 0.35;
  const variance = Math.random() * 0.2;
  const congestion_level = Math.min((base + variance) * 100, 100);
  const speed_kph = Math.max(12, 40 - congestion_level * 0.25 + Math.random() * 4);
  const travel_time_index = Number((1 + congestion_level / 100).toFixed(2));
  return {
    city,
    congestion_level: Number(congestion_level.toFixed(2)),
    speed_kph: Number(speed_kph.toFixed(2)),
    travel_time_index,
    source: "simulated",
  };
}

export async function getTrafficForCity(city) {
  if (!apiKey()) {
    return simulateTraffic(city);
  }

  let lat;
  let lon;
  try {
    const coords = await getCityCoordinates(city);
    lat = coords.lat;
    lon = coords.lon;
  } catch (err) {
    logger.warn({ city, err: err.message }, "Traffic geocode failed, using simulation");
    return simulateTraffic(city);
  }
  const url = new URL(flowUrl());
  url.searchParams.set("key", apiKey());
  url.searchParams.set("point", `${lat},${lon}`);
  url.searchParams.set("unit", "KMPH");

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    logger.warn({ city, text }, "Traffic API failed, falling back to simulation");
    return simulateTraffic(city);
  }

  const data = await response.json();
  const flow = data?.flowSegmentData;
  if (!flow) {
    return simulateTraffic(city);
  }

  const freeFlow = Number(flow.freeFlowSpeed || 0);
  const current = Number(flow.currentSpeed || 0);
  const congestion_level = freeFlow > 0 ? (1 - current / freeFlow) * 100 : 0;
  const travel_time_index = freeFlow > 0 ? Number((freeFlow / Math.max(current, 1)).toFixed(2)) : 1;

  return {
    city,
    congestion_level: Number(Math.max(congestion_level, 0).toFixed(2)),
    speed_kph: current,
    travel_time_index,
    source: "tomtom",
  };
}
