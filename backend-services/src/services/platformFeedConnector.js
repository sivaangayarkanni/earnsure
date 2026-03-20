import { query } from "../db/pg.js";
import { logger } from "../lib/logger.js";
import { getPlatformDemand } from "./platformDemandService.js";

const feedUrl = () => process.env.PLATFORM_FEED_URL;
const feedToken = () => process.env.PLATFORM_FEED_TOKEN;

async function fetchFeed(city) {
  if (!feedUrl()) return null;
  const url = new URL(feedUrl());
  url.searchParams.set("city", city);
  const response = await fetch(url, {
    headers: feedToken() ? { Authorization: `Bearer ${feedToken()}` } : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Platform feed failed: ${text}`);
  }
  return response.json();
}

async function buildMockFeed(city) {
  const demand = await getPlatformDemand(city);
  const { rows: workers } = await query("SELECT id FROM workers WHERE city = $1", [city]);
  const zones = demand?.zones || [];
  const activity = workers.map((worker) => {
    const zoneEntry = zones[Math.floor(Math.random() * zones.length)] || {};
    const ordersPerHour = Number(zoneEntry.orders_per_hour || 8);
    const ordersReceived = Math.max(0, Math.round(ordersPerHour * (0.5 + Math.random() * 0.6)));
    const ordersAccepted = Math.max(0, Math.round(ordersReceived * (0.7 + Math.random() * 0.2)));
    return {
      worker_id: worker.id,
      zone: zoneEntry.zone || "Central",
      online_status: true,
      orders_received: ordersReceived,
      orders_accepted: ordersAccepted,
      earnings: ordersAccepted * 65,
    };
  });
  return { city, zones, activity, source: "mock" };
}

async function ingestDemand(city, zones) {
  let count = 0;
  for (const zoneEntry of zones) {
    const zoneName = zoneEntry.zone || zoneEntry.name || zoneEntry.area || "Central";
    await query(
      `INSERT INTO platform_demand (city, zone, orders_per_hour, active_workers, demand_index, recorded_at)
       VALUES ($1, $2, $3, $4, $5, now())`,
      [
        city,
        zoneName,
        Number(zoneEntry.orders_per_hour || 0),
        Number(zoneEntry.active_workers || 0),
        Number(zoneEntry.demand_index || 0),
      ]
    );
    await query(
      `INSERT INTO zone_demand (city, zone, demand_level, recorded_at)
       VALUES ($1, $2, $3, now())`,
      [city, zoneName, Number(zoneEntry.demand_index || 0)]
    );
    count += 1;
  }
  return count;
}

async function ingestActivity(city, activity = []) {
  let count = 0;
  for (const entry of activity) {
    if (!entry.worker_id) continue;
    await query(
      `INSERT INTO worker_activity
       (worker_id, city, zone, latitude, longitude, online_status, orders_received, orders_accepted, earnings, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())`,
      [
        entry.worker_id,
        city,
        entry.zone || null,
        entry.latitude ?? null,
        entry.longitude ?? null,
        entry.online_status ?? true,
        entry.orders_received ?? 0,
        entry.orders_accepted ?? 0,
        entry.earnings ?? 0,
      ]
    );
    count += 1;
  }
  return count;
}

export async function ingestPlatformFeed(city) {
  let feed = null;
  try {
    feed = await fetchFeed(city);
  } catch (err) {
    logger.warn({ err: err.message }, "Platform feed fetch failed, falling back");
  }

  if (!feed) {
    feed = await buildMockFeed(city);
  }

  if (!Array.isArray(feed.zones) || feed.zones.length === 0) {
    const fallback = await getPlatformDemand(city);
    feed.zones = fallback?.zones || [];
  }

  const demandCount = await ingestDemand(city, feed.zones || []);
  const activityCount = await ingestActivity(city, feed.activity || []);

  return {
    source: feed.source || (feedUrl() ? "api" : "mock"),
    demandCount,
    activityCount,
    zones: feed.zones || [],
  };
}
