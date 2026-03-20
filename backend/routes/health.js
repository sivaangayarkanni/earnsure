const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "earnsure-backend",
    time: new Date().toISOString(),
  });
});

module.exports = { healthRouter: router };

