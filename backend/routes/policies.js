const express = require("express");
const {
  createPolicyHandler,
  listWorkerPolicies,
} = require("../controllers/policiesController");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

router.post("/create", asyncHandler(createPolicyHandler));
router.get("/:worker_id", asyncHandler(listWorkerPolicies));

module.exports = { policiesRouter: router };

