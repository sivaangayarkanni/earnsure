const { models, sequelize } = require("../models");
const { Op } = require("sequelize");

async function getAdminStats() {
  const [totalWorkers, activePolicies, claimStats, pools] = await Promise.all([
    models.Worker.count(),
    models.Policy.count({ where: { status: "active" } }),
    sequelize.query(
      `SELECT
        COUNT(*) AS total_claims,
        SUM(CASE WHEN claim_status IN ('paid','approved') THEN payout_amount ELSE 0 END) AS total_paid,
        SUM(weekly_premium) AS premium_revenue
       FROM claims c
       JOIN policies p ON c.policy_id = p.policy_id`,
      { type: sequelize.QueryTypes.SELECT }
    ),
    models.Pool.findAll(),
  ]);

  const stats = claimStats[0] || {};
  const poolBalance = pools.reduce((s, p) => s + Number(p.total_balance), 0);
  const poolReserve = pools.reduce((s, p) => s + Number(p.reserve_fund), 0);
  const poolHealth = poolBalance > 0 ? Math.min((poolBalance / Math.max(Number(stats.total_paid) || 1, 1)), 1) : 0.76;

  return {
    workersActive: totalWorkers,
    activePolicies,
    premiumRevenue: Number(stats.premium_revenue) || 0,
    claimsPaid: Number(stats.total_paid) || 0,
    poolBalance,
    poolReserve,
    poolHealth: Math.min(poolHealth, 1),
    fraudFlagged: 0,
  };
}

async function getPoolStats() {
  return models.Pool.findAll({ order: [["city", "ASC"]] });
}

async function getRecentRiskEvents({ limit = 20 }) {
  return models.RiskEvent.findAll({
    order: [["timestamp", "DESC"]],
    limit,
  });
}

async function logRiskEvent({ location, eventType, severity }) {
  return models.RiskEvent.create({ location, event_type: eventType, severity });
}

module.exports = { getAdminStats, getPoolStats, getRecentRiskEvents, logRiskEvent };
