import { Router } from "express";
import { listPolicies, getPolicyById, createPolicy } from "../services/policyService.js";
import { query } from "../db/pg.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const policies = await listPolicies({
      status: req.query.status,
      limit: req.query.limit,
    });
    res.json({ policies });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const policy = await getPolicyById(req.params.id);
    if (!policy) {
      res.status(404).json({ error: "Policy not found" });
      return;
    }
    res.json({ policy });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const policy = await createPolicy(req.body);
    res.status(201).json({ policy });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/pause", async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE policies
       SET status = 'paused'
       WHERE policy_id = $1
       RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Policy not found" });
      return;
    }
    res.json({ policy: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/resume", async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE policies
       SET status = 'active'
       WHERE policy_id = $1
       RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Policy not found" });
      return;
    }
    res.json({ policy: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
