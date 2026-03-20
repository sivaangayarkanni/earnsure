const express = require("express");
const {
  registerWorker,
  fetchWorker,
  fetchWorkers,
} = require("../controllers/workersController");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

router.post("/register", asyncHandler(registerWorker));
router.get("/:id", asyncHandler(fetchWorker));
router.get("/", asyncHandler(fetchWorkers));

module.exports = { workersRouter: router };

