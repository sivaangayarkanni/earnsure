const { models, sequelize } = require("../models");
const { Op } = require("sequelize");

const HOURLY_INCOME = 120;
const LOST_HOURS = 3;

async function createClaim({ workerId, eventType }) {
  // find active policy for worker
  const policy = await models.Policy.findOne({
    where: { worker_id: workerId, status: "active" },
    order: [["start_date", "DESC"]],
  });
  if (!policy) return null;

  const lostIncome = HOURLY_INCOME * LOST_HOURS;
  const claim = await models.Claim.create({
    policy_id: policy.policy_id,
    event_type: eventType,
    lost_income: lostIncome,
    claim_status: "submitted",
    payout_amount: lostIncome,
  });
  return claim;
}

async function listClaimsByWorker(workerId) {
  const policies = await models.Policy.findAll({ where: { worker_id: workerId } });
  if (!policies.length) return [];
  const policyIds = policies.map((p) => p.policy_id);
  return models.Claim.findAll({
    where: { policy_id: { [Op.in]: policyIds } },
    order: [["created_at", "DESC"]],
  });
}

async function listAllClaims({ limit = 50, offset = 0 }) {
  return models.Claim.findAll({
    include: [{ model: models.Policy, as: "policy", include: [{ model: models.Worker, as: "worker" }] }],
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });
}

async function updateClaimStatus({ claimId, status }) {
  const claim = await models.Claim.findByPk(claimId);
  if (!claim) return null;
  claim.claim_status = status;
  await claim.save();
  return claim;
}

async function getClaimStats() {
  const total = await models.Claim.count();
  const paid = await models.Claim.count({ where: { claim_status: { [Op.in]: ["paid", "approved"] } } });
  const pending = await models.Claim.count({ where: { claim_status: "submitted" } });
  const rejected = await models.Claim.count({ where: { claim_status: "rejected" } });
  const totalPayout = await models.Claim.sum("payout_amount", {
    where: { claim_status: { [Op.in]: ["paid", "approved"] } },
  });
  return { total, paid, pending, rejected, totalPayout: totalPayout || 0 };
}

module.exports = { createClaim, listClaimsByWorker, listAllClaims, updateClaimStatus, getClaimStats };
