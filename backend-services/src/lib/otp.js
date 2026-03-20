import crypto from "node:crypto";

const otpSecret = process.env.OTP_SECRET || "dev_otp_secret";

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashOtp(phone, code) {
  return crypto
    .createHmac("sha256", otpSecret)
    .update(`${phone}:${code}`)
    .digest("hex");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
