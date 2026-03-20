import twilio from "twilio";
import { logger } from "../lib/logger.js";

let client = null;

export function getTwilioClient() {
  if (process.env.TWILIO_DISABLED === "true") {
    return null;
  }
  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

export async function sendOtpSms(phone, code) {
  const message = `Your EarnSure OTP is ${code}. It expires in ${process.env.OTP_TTL_MINUTES || 5} minutes.`;
  const twilioClient = getTwilioClient();
  if (!twilioClient) {
    logger.info({ phone, code }, "Twilio disabled; OTP logged");
    return { status: "skipped" };
  }

  const result = await twilioClient.messages.create({
    body: message,
    from: process.env.TWILIO_FROM_NUMBER,
    to: phone,
  });

  return { status: "sent", sid: result.sid };
}
