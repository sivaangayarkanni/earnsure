const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");
const { createClaim, listClaimsByWorker, listAllClaims, updateClaimStatus, getClaimStats } = require("../services/claimsService");
const { AppError } = require("../utils/errors");

const router = express.Router();

// POST /claims/trigger — auto-trigger claim from weather event
router.post("/trigger", asyncHandler(async (req, res) => {
  const { worker_id, event_type } = req.body;
  if (!worker_id || !event_type) throw new AppError("worker_id and event_type required", 400);
  const claim = await createClaim({ workerId: worker_id, eventType: event_type });
  if (!claim) throw new AppError("No active policy found for worker", 404);
  res.status(201).json({ data: claim });
}));

// GET /claims/worker/:worker_id
router.get("/worker/:worker_id", asyncHandler(async (req, res) => {
  const claims = await listClaimsByWorker(req.params.worker_id);
  res.json({ data: claims });
}));

// GET /claims/stats
router.get("/stats", asyncHandler(async (req, res) => {
  const stats = await getClaimStats();
  res.json({ data: stats });
}));

// GET /claims — all claims (admin)
router.get("/", asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const claims = await listAllClaims({ limit, offset });
  res.json({ data: claims });
}));

// PATCH /claims/:claim_id/status
router.patch("/:claim_id/status", asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ["submitted", "approved", "rejected", "paid"];
  if (!allowed.includes(status)) throw new AppError(`status must be one of: ${allowed.join(", ")}`, 400);
  const claim = await updateClaimStatus({ claimId: req.params.claim_id, status });
  if (!claim) throw new AppError("Claim not found", 404);
  res.json({ data: claim });
}));

module.exports = { claimsRouter: router };
