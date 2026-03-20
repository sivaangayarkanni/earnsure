import { Router } from "express";
import { createTrigger, evaluateTrigger } from "../services/triggerService.js";
import { createPayout } from "../services/payoutService.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const trigger = await createTrigger(req.body);
    res.status(201).json({ trigger });
  } catch (err) {
    next(err);
  }
});

router.post("/evaluate", async (req, res, next) => {
  try {
    const result = await evaluateTrigger(req.body);
    if (result.status === "met" && req.body.payoutCents) {
      const payout = await createPayout({
        policyId: req.body.policyId,
        triggerId: result.triggerId,
        amountCents: req.body.payoutCents,
        currency: req.body.currency,
        reason: req.body.reason,
      });
      res.json({ result, payout });
      return;
    }
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

export default router;
