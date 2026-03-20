const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");
const { sendOTP, verifyOTPAndLogin, registerWorker, adminLogin } = require("../services/authService");
const { AppError } = require("../utils/errors");

const router = express.Router();

// POST /auth/otp/send — send OTP to phone
router.post("/otp/send", asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) throw new AppError("phone is required", 400);
  const result = await sendOTP(phone.trim());
  res.json({ data: result });
}));

// POST /auth/otp/verify — verify OTP and login
router.post("/otp/verify", asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) throw new AppError("phone and otp are required", 400);
  const { worker, policy } = await verifyOTPAndLogin(phone.trim(), String(otp).trim());
  res.json({
    data: {
      worker: {
        id: worker.id,
        name: worker.name,
        phone: worker.phone,
        city: worker.city,
        platform: worker.platform,
        // workType removed for prototype
        riskScore: worker.risk_score,
        // latitude, longitude removed for prototype
      },
      policy: policy ? {
        policyId: policy.policy_id,
        planType: policy.plan_type,
        weeklyPremium: policy.weekly_premium,
        status: policy.status,
      } : null,
      role: "worker",
    },
  });
}));

// POST /auth/register — register new worker
router.post("/register", asyncHandler(async (req, res) => {
  const { name, phone, city, platform } = req.body;
  if (!name || !phone || !city || !platform) {
    throw new AppError("name, phone, city, platform are required", 400);
  }
  const { worker, policy } = await registerWorker({ name, phone, city, platform });
  res.status(201).json({
    data: {
      worker: {
        id: worker.id,
        name: worker.name,
        phone: worker.phone,
        city: worker.city,
        platform: worker.platform,
        // workType removed for prototype
        riskScore: worker.risk_score,
      },
      policy: {
        policyId: policy.policy_id,
        planType: policy.plan_type,
        weeklyPremium: policy.weekly_premium,
        status: policy.status,
      },
      role: "worker",
    },
  });
}));

// POST /auth/admin/login — admin login
router.post("/admin/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError("email and password are required", 400);
  const admin = await adminLogin(email.trim(), password);
  res.json({ data: { ...admin, role: "admin" } });
}));

module.exports = { authRouter: router };
