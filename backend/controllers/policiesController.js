const {
  createPolicy,
  listPoliciesByWorker,
  PLAN_PRICING,
} = require("../services/policiesService");
const { AppError } = require("../utils/errors");

function validatePolicyPayload(payload) {
  const missing = [];
  if (!payload.worker_id) missing.push("worker_id");
  if (!payload.plan_type) missing.push("plan_type");
  if (missing.length) {
    throw new AppError("Validation failed", 400, { missing });
  }

  if (!PLAN_PRICING[payload.plan_type]) {
    throw new AppError("Invalid plan_type", 400, {
      allowed: Object.keys(PLAN_PRICING),
    });
  }
}

async function createPolicyHandler(req, res) {
  validatePolicyPayload(req.body || {});
  const result = await createPolicy({
    workerId: req.body.worker_id,
    planType: req.body.plan_type,
  });

  if (!result) {
    throw new AppError("Worker not found", 404);
  }

  res.status(201).json({ data: result.policy });
}

async function listWorkerPolicies(req, res) {
  const policies = await listPoliciesByWorker(req.params.worker_id);
  res.json({ data: policies });
}

module.exports = {
  createPolicyHandler,
  listWorkerPolicies,
};

