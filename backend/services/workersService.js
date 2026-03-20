const { models } = require("../models");

async function createWorker({ name, phone, city, platform }) {
  return models.Worker.create({
    name: name || null,
    phone,
    city,
    platform,
  });
}

async function getWorkerById(id) {
  return models.Worker.findByPk(id);
}

async function listWorkers({ limit = 50, offset = 0 }) {
  return models.Worker.findAll({
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });
}

module.exports = {
  createWorker,
  getWorkerById,
  listWorkers,
};

