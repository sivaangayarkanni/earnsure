import jwt from "jsonwebtoken";

const accessSecret = process.env.ACCESS_TOKEN_SECRET || "dev_access_secret";
const refreshSecret = process.env.REFRESH_TOKEN_SECRET || "dev_refresh_secret";
const accessTtl = process.env.ACCESS_TOKEN_TTL || "15m";
const refreshTtl = process.env.REFRESH_TOKEN_TTL || "14d";

export function signAccessToken(payload) {
  return jwt.sign(payload, accessSecret, { expiresIn: accessTtl });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshTtl });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret);
}
