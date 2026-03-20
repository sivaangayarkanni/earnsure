import { Router } from "express";
import { getPlatformDemand } from "../services/platformDemandService.js";

const router = Router();

router.get("/platform-feed", async (req, res, next) => {
  try {
    const city = req.query.city || "Bengaluru";
    const demand = await getPlatformDemand(city);
    const zones = demand?.zones || [];
    const activity = zones.slice(0, 4).map((zone) => ({
      worker_id: null,
      zone: zone.zone,
      online_status: true,
      orders_received: Math.max(1, Math.round(Number(zone.orders_per_hour || 8) * 0.6)),
      orders_accepted: Math.max(1, Math.round(Number(zone.orders_per_hour || 8) * 0.45)),
      earnings: Math.round(Number(zone.orders_per_hour || 8) * 0.45) * 65,
    }));
    res.json({ city, zones, activity, source: "mock" });
  } catch (err) {
    next(err);
  }
});

export default router;
