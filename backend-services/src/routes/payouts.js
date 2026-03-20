import { Router } from "express";
import { listPayouts } from "../services/payoutService.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    if (!req.query.policyId) {
      res.status(400).json({ error: "policyId is required" });
      return;
    }
    const payouts = await listPayouts({
      policyId: req.query.policyId,
      limit: req.query.limit,
    });
    res.json({ payouts });
  } catch (err) {
    next(err);
  }
});

export default router;
