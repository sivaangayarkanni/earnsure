const {
  createWorker,
  getWorkerById,
  listWorkers,
} = require("../services/workersService");
const { AppError } = require("../utils/errors");

function validateWorkerPayload(payload) {
  const missing = [];
  if (!payload.phone || String(payload.phone).trim() === "") missing.push("phone");
  if (!payload.city || String(payload.city).trim() === "") missing.push("city");
  if (!payload.platform || String(payload.platform).trim() === "")
    missing.push("platform");
  if (missing.length) {
    throw new AppError("Validation failed", 400, {
      missing,
    });
  }
}

async function registerWorker(req, res) {
  validateWorkerPayload(req.body || {});
  const worker = await createWorker(req.body);
  res.status(201).json({ data: worker });
}

async function fetchWorker(req, res) {
  const worker = await getWorkerById(req.params.id);
  if (!worker) {
    throw new AppError("Worker not found", 404);
  }
  res.json({ data: worker });
}

async function fetchWorkers(req, res) {
  const limitRaw = Number(req.query.limit);
  const offsetRaw = Number(req.query.offset);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 200)
    : 50;
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;
  const workers = await listWorkers({ limit, offset });
  res.json({ data: workers, meta: { limit, offset } });
}

module.exports = {
  registerWorker,
  fetchWorker,
  fetchWorkers,
};
