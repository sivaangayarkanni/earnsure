import { Router } from "express";
import { z } from "zod";
import { query } from "../db/pg.js";
import { hashToken } from "../lib/otp.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js";
import { getTwilioClient } from "../services/twilioService.js";
import { sendVerifyCode, checkVerifyCode } from "../services/twilioVerifyService.js";

const router = Router();

const requestSchema = z.object({
  phone: z.string().min(8),
  role: z.enum(["worker", "admin"]),
  name: z.string().optional(),
  city: z.string().optional(),
});

const verifySchema = z.object({
  phone: z.string().min(8),
  role: z.enum(["worker", "admin"]),
  code: z.string().min(4),
  name: z.string().optional(),
  city: z.string().optional(),
});

const refreshSchema = z.object({ refresh_token: z.string().min(10) });

function parseTtlToMs(ttl) {
  if (typeof ttl === "number") return ttl * 1000;
  const match = String(ttl).match(/^(\d+)([smhd])$/);
  if (!match) return 14 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
}

function isAdminAllowed(phone) {
  const list = (process.env.ADMIN_WHITELIST || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (list.length === 0) return true;
  return list.includes(phone);
}

router.post("/request-otp", async (req, res, next) => {
  try {
    const payload = requestSchema.parse(req.body);

    if (payload.role === "admin" && !isAdminAllowed(payload.phone)) {
      res.status(403).json({ error: "Admin access denied." });
      return;
    }

    const twilioClient = getTwilioClient();
    const result = await sendVerifyCode(payload.phone, twilioClient);
    const response = { status: "sent" };
    if (result.dev_code) response.dev_code = result.dev_code;
    res.json(response);
  } catch (err) {
    next(err);
  }
});

router.post("/verify-otp", async (req, res, next) => {
  try {
    const payload = verifySchema.parse(req.body);

    if (payload.role === "admin" && !isAdminAllowed(payload.phone)) {
      res.status(403).json({ error: "Admin access denied." });
      return;
    }

    const twilioClient = getTwilioClient();
    const verifyResult = await checkVerifyCode(payload.phone, payload.code, twilioClient);
    if (!verifyResult.valid) {
      res.status(400).json({ error: "Invalid OTP." });
      return;
    }

    let user = null;
    const { rows: userRows } = await query(
      "SELECT * FROM users WHERE phone = $1 AND role = $2",
      [payload.phone, payload.role]
    );
    user = userRows[0];

    if (!user) {
      let workerId = null;
      if (payload.role === "worker") {
        const { rows: workerRows } = await query(
          `INSERT INTO workers (name, phone, city, platform, risk_score)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [
            payload.name || "Worker",
            payload.phone,
            payload.city || "Bengaluru",
            "Gig Platform",
            0.3,
          ]
        );
        workerId = workerRows[0].id;

        await query(
          `INSERT INTO worker_activity (worker_id, city)
           VALUES ($1, $2)`,
          [workerId, payload.city || "Bengaluru"]
        );
      }

      const { rows: created } = await query(
        `INSERT INTO users (role, phone, worker_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [payload.role, payload.phone, workerId]
      );
      user = created[0];
    }

    const access_token = signAccessToken({
      sub: user.id,
      role: user.role,
      worker_id: user.worker_id,
    });
    const refresh_token = signRefreshToken({
      sub: user.id,
      role: user.role,
    });

    const refreshExpiry = new Date(Date.now() + parseTtlToMs(process.env.REFRESH_TOKEN_TTL || "14d"));
    await query(
      `INSERT INTO auth_refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, hashToken(refresh_token), refreshExpiry]
    );

    res.json({
      access_token,
      refresh_token,
      user: {
        id: user.id,
        role: user.role,
        worker_id: user.worker_id,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const { refresh_token } = refreshSchema.parse(req.body);
    const payload = verifyRefreshToken(refresh_token);

    const { rows } = await query(
      `SELECT * FROM auth_refresh_tokens
       WHERE user_id = $1 AND token_hash = $2 AND revoked_at IS NULL AND expires_at > now()
       ORDER BY created_at DESC
       LIMIT 1`,
      [payload.sub, hashToken(refresh_token)]
    );

    if (!rows[0]) {
      res.status(401).json({ error: "Refresh token invalid." });
      return;
    }

    const access_token = signAccessToken({
      sub: payload.sub,
      role: payload.role,
    });

    res.json({ access_token });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const { refresh_token } = refreshSchema.parse(req.body);
    const payload = verifyRefreshToken(refresh_token);

    await query(
      `UPDATE auth_refresh_tokens
       SET revoked_at = now()
       WHERE user_id = $1 AND token_hash = $2`,
      [payload.sub, hashToken(refresh_token)]
    );

    res.json({ status: "logged_out" });
  } catch (err) {
    next(err);
  }
});

export default router;
