const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");
const { getAdminStats, getPoolStats, getRecentRiskEvents, logRiskEvent } = require("../services/adminService");

const router = express.Router();

router.get("/stats", asyncHandler(async (req, res) => {
  const stats = await getAdminStats();
  res.json({ data: stats });
}));

router.get("/pools", asyncHandler(async (req, res) => {
  const pools = await getPoolStats();
  res.json({ data: pools });
}));

router.get("/risk-events", asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const events = await getRecentRiskEvents({ limit });
  res.json({ data: events });
}));

router.post("/risk-events", asyncHandler(async (req, res) => {
  const { location, event_type, severity } = req.body;
  const event = await logRiskEvent({ location, eventType: event_type, severity: severity || 0 });
  res.status(201).json({ data: event });
}));

module.exports = { adminRouter: router };
