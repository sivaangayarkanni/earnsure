const { models } = require("../models");
const { Op } = require("sequelize");

// Simple OTP store (in-memory for demo — use Redis in production)
const otpStore = new Map();

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOTP(phone) {
  const worker = await models.Worker.findOne({ where: { phone } });
  const otp = generateOTP();
  otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
  // In production: send via SMS API (Twilio/MSG91)
  console.log(`[OTP] Phone: ${phone} → OTP: ${otp}`); // visible in backend terminal
  return {
    sent: true,
    isNewUser: !worker,
    // Return OTP in dev mode so frontend can show it
    devOtp: process.env.NODE_ENV === "development" ? otp : undefined,
  };
}

async function verifyOTPAndLogin(phone, otp) {
  const stored = otpStore.get(phone);
  if (!stored) throw new Error("OTP not found. Request a new one.");
  if (Date.now() > stored.expiresAt) { otpStore.delete(phone); throw new Error("OTP expired."); }
  if (stored.otp !== String(otp)) throw new Error("Invalid OTP.");
  otpStore.delete(phone);

  const worker = await models.Worker.findOne({ where: { phone } });
  if (!worker) throw new Error("Worker not found. Please sign up first.");

  const policy = await models.Policy.findOne({
    where: { worker_id: worker.id, status: "active" },
    order: [["start_date", "DESC"]],
  });

  return { worker, policy };
}

async function registerWorker({ name, phone, city, platform }) {
  const existing = await models.Worker.findOne({ where: { phone } });
  if (existing) throw new Error("Phone number already registered.");

  const worker = await models.Worker.create({
    name,
    phone,
    city,
    platform,
    // work_type, latitude, longitude removed for prototype
    risk_score: 0.42,
  });

  // Auto-create standard policy
  const premiumMap = { "basic": 25, "standard": 35, "premium": 50 };
  const planType = "standard";
  const policy = await models.Policy.create({
    worker_id: worker.id,
    plan_type: planType,
    weekly_premium: premiumMap[planType],
    coverage_details: { trigger: "parametric", payout_cap: 14000 },
    status: "active",
    start_date: new Date(),
  });

  return { worker, policy };
}

// Admin credentials (hardcoded for demo — use DB in production)
const ADMIN_CREDENTIALS = [
  { email: "ops@earnsure.com", password: "admin123", name: "Operations Admin" },
  { email: "admin@earnsure.com", password: "earnsure2026", name: "Super Admin" },
];

async function adminLogin(email, password) {
  const admin = ADMIN_CREDENTIALS.find(a => a.email === email && a.password === password);
  if (!admin) throw new Error("Invalid email or password.");
  return { name: admin.name, email: admin.email, role: "admin" };
}

module.exports = { sendOTP, verifyOTPAndLogin, registerWorker, adminLogin };
