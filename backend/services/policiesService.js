const { models } = require("../models");

const PLAN_PRICING = {
  basic: 25,
  standard: 35,
  premium: 50,
};

function calculateWeeklyPremium(planType, riskScore) {
  const base = PLAN_PRICING[planType];
  const multiplier = 1 + (Number(riskScore) || 0) / 100;
  const raw = base * multiplier;
  return Math.round(raw * 100) / 100;
}

async function createPolicy({ workerId, planType }) {
  const worker = await models.Worker.findByPk(workerId);
  if (!worker) {
    return null;
  }

  const weeklyPremium = calculateWeeklyPremium(planType, worker.risk_score);
  const policy = await models.Policy.create({
    worker_id: workerId,
    plan_type: planType,
    weekly_premium: weeklyPremium,
    coverage_details: {},
    status: "active",
    start_date: new Date(),
  });

  return { policy, worker };
}

async function listPoliciesByWorker(workerId) {
  return models.Policy.findAll({
    where: { worker_id: workerId },
    order: [["start_date", "DESC"]],
  });
}

module.exports = {
  PLAN_PRICING,
  calculateWeeklyPremium,
  createPolicy,
  listPoliciesByWorker,
};

