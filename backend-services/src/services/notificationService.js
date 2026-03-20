import { query } from "../db/pg.js";
import { getTwilioClient } from "./twilioService.js";
import { logger } from "../lib/logger.js";

const notificationsEnabled = () => process.env.NOTIFICATIONS_ENABLED !== "false";

async function fetchWorkerPhone(workerId) {
  const { rows } = await query("SELECT phone FROM workers WHERE id = $1", [workerId]);
  return rows[0]?.phone || null;
}

function parseChannels() {
  const raw = process.env.NOTIFY_CHANNELS || "sms";
  return raw
    .split(",")
    .map((channel) => channel.trim().toLowerCase())
    .filter(Boolean);
}

async function sendViaChannel({ channel, phone, message }) {
  if (!notificationsEnabled()) {
    return { status: "skipped" };
  }

  if (!phone) {
    return { status: "failed" };
  }

  const client = getTwilioClient();
  if (!client) {
    logger.info({ channel, phone, message }, "Twilio disabled; notification logged");
    return { status: "skipped" };
  }

  try {
    const from =
      channel === "whatsapp"
        ? process.env.TWILIO_WHATSAPP_FROM
        : process.env.TWILIO_FROM_NUMBER;

    if (!from) {
      logger.warn({ channel }, "Notification sender not configured");
      return { status: "failed" };
    }

    const to = channel === "whatsapp" ? `whatsapp:${phone}` : phone;

    const result = await client.messages.create({
      body: message,
      from,
      to,
    });
    return { status: "sent", provider_ref: result.sid };
  } catch (err) {
    logger.error({ err }, "Twilio notification failed");
    return { status: "failed" };
  }
}

export async function sendWorkerNotification({ workerId, type, message, dedupeHours = 0 }) {
  if (dedupeHours > 0) {
    const { rows } = await query(
      `SELECT id
       FROM notifications
       WHERE worker_id = $1 AND type = $2
         AND created_at > now() - ($3::text || ' hours')::interval
       LIMIT 1`,
      [workerId, type, dedupeHours]
    );
    if (rows[0]) {
      return { status: "skipped" };
    }
  }
  const phone = await fetchWorkerPhone(workerId);
  const channels = parseChannels();
  const results = [];

  for (const channel of channels) {
    const result = await sendViaChannel({ channel, phone, message });
    await query(
      `INSERT INTO notifications (worker_id, type, message, status, channel)
       VALUES ($1, $2, $3, $4, $5)`,
      [workerId, type, message, result.status, channel]
    );
    results.push({ channel, ...result });
  }

  return { status: results[0]?.status || "skipped", results };
}

export async function listWorkerNotifications(workerId, limit = 10) {
  const { rows } = await query(
    `SELECT id, type, message, status, channel, created_at
     FROM notifications
     WHERE worker_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [workerId, limit]
  );
  return rows;
}
