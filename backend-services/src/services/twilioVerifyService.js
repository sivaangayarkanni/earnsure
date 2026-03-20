import { logger } from "../lib/logger.js";

const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;
const ttlMinutes = Number(process.env.OTP_TTL_MINUTES || 5);

const memoryStore = new Map();

function now() {
  return Date.now();
}

function isDisabled() {
  return process.env.TWILIO_DISABLED === "true";
}

export async function sendVerifyCode(phone, twilioClient) {
  if (isDisabled()) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    memoryStore.set(phone, {
      code,
      expiresAt: now() + ttlMinutes * 60000,
    });
    logger.info({ phone, code }, "Twilio Verify disabled; OTP cached");
    return { status: "skipped", dev_code: code };
  }

  if (!verifySid) {
    throw new Error("TWILIO_VERIFY_SERVICE_SID is not set.");
  }

  const result = await twilioClient.verify
    .services(verifySid)
    .verifications.create({ to: phone, channel: "sms" });

  return { status: result.status };
}

export async function checkVerifyCode(phone, code, twilioClient) {
  if (isDisabled()) {
    const record = memoryStore.get(phone);
    if (!record) return { valid: false };
    if (record.expiresAt < now()) {
      memoryStore.delete(phone);
      return { valid: false };
    }
    const valid = record.code === code;
    if (valid) memoryStore.delete(phone);
    return { valid };
  }

  if (!verifySid) {
    throw new Error("TWILIO_VERIFY_SERVICE_SID is not set.");
  }

  const result = await twilioClient.verify
    .services(verifySid)
    .verificationChecks.create({ to: phone, code });

  return { valid: result.status === "approved" };
}
