const express = require("express");
const { healthRouter } = require("./health");
const { authRouter } = require("./auth");
const { workersRouter } = require("./workers");
const { policiesRouter } = require("./policies");
const { claimsRouter } = require("./claims");
const { adminRouter } = require("./admin");
const { mcpRouter } = require("./mcp");

const router = express.Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/workers", workersRouter);
router.use("/policies", policiesRouter);
router.use("/claims", claimsRouter);
router.use("/admin", adminRouter);
router.use("/mcp", mcpRouter);

module.exports = { apiRouter: router };
