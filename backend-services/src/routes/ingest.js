import { Router } from "express";
import { query } from "../db/pg.js";
import { z } from "zod";

const router = Router();

function requireIngestKey(req, res, next) {
  const required = process.env.INGEST_API_KEY;
  if (!required) return next();
  const provided =
    req.headers["x-ingest-key"] ||
    (req.headers.authorization || "").replace("Bearer ", "");
  if (provided !== required) {
    res.status(403).json({ error: "Invalid ingest key." });
    return;
  }
  next();
}

router.use(requireIngestKey);

router.post("/demand", async (req, res, next) => {
  try {
    const schema = z.object({
      city: z.string().min(2),
      zones: z.array(
        z.object({
          zone: z.string().min(1),
          orders_per_hour: z.number().nonnegative().optional(),
          active_workers: z.number().int().nonnegative().optional(),
          demand_index: z.number().nonnegative().optional(),
        })
      ),
    });
    const payload = schema.parse(req.body);

    for (const zoneEntry of payload.zones) {
      await query(
        `INSERT INTO platform_demand (city, zone, orders_per_hour, active_workers, demand_index, recorded_at)
         VALUES ($1, $2, $3, $4, $5, now())`,
        [
          payload.city,
          zoneEntry.zone,
          Number(zoneEntry.orders_per_hour || 0),
          Number(zoneEntry.active_workers || 0),
          Number(zoneEntry.demand_index || 0),
        ]
      );
      await query(
        `INSERT INTO zone_demand (city, zone, demand_level, recorded_at)
         VALUES ($1, $2, $3, now())`,
        [payload.city, zoneEntry.zone, Number(zoneEntry.demand_index || 0)]
      );
    }

    res.json({ status: "ok", zones: payload.zones.length });
  } catch (err) {
    next(err);
  }
});

router.post("/activity", async (req, res, next) => {
  try {
    const schema = z.object({
      worker_id: z.string().min(8),
      city: z.string().min(2),
      zone: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      online_status: z.boolean().optional(),
      orders_received: z.number().int().nonnegative().optional(),
      orders_accepted: z.number().int().nonnegative().optional(),
      earnings: z.number().nonnegative().optional(),
      recorded_at: z.string().optional(),
    });
    const payload = schema.parse(req.body);

    await query(
      `INSERT INTO worker_activity
       (worker_id, city, zone, latitude, longitude, online_status, orders_received, orders_accepted, earnings, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10::timestamptz, now()))`,
      [
        payload.worker_id,
        payload.city,
        payload.zone || null,
        payload.latitude ?? null,
        payload.longitude ?? null,
        payload.online_status ?? true,
        payload.orders_received ?? 0,
        payload.orders_accepted ?? 0,
        payload.earnings ?? 0,
        payload.recorded_at || null,
      ]
    );

    res.json({ status: "ok" });
  } catch (err) {
    next(err);
  }
});

router.post("/traffic", async (req, res, next) => {
  try {
    const schema = z.object({
      city: z.string().min(2),
      zone: z.string().optional(),
      congestion_level: z.number().nonnegative(),
      speed_kph: z.number().nonnegative().optional(),
      travel_time_index: z.number().nonnegative().optional(),
    });
    const payload = schema.parse(req.body);

    await query(
      `INSERT INTO traffic_events (city, zone, congestion_level, speed_kph, travel_time_index, recorded_at)
       VALUES ($1, $2, $3, $4, $5, now())`,
      [
        payload.city,
        payload.zone || null,
        payload.congestion_level,
        payload.speed_kph ?? null,
        payload.travel_time_index ?? null,
      ]
    );

    res.json({ status: "ok" });
  } catch (err) {
    next(err);
  }
});

export default router;
