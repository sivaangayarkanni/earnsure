import request from "supertest";
import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";

process.env.TWILIO_DISABLED = "true";
process.env.ACCESS_TOKEN_SECRET = "test_access";
process.env.REFRESH_TOKEN_SECRET = "test_refresh";
process.env.OTP_TTL_MINUTES = "5";
process.env.ADMIN_WHITELIST = "";

const app = createApp();

describe("Auth flow", () => {
  it("should request and verify OTP", async () => {
    const phone = "+919999999999";
    const requestRes = await request(app)
      .post("/auth/request-otp")
      .send({ phone, role: "worker" })
      .expect(200);

    const devCode = requestRes.body.dev_code;
    expect(devCode).toBeTruthy();

    const verifyRes = await request(app)
      .post("/auth/verify-otp")
      .send({ phone, role: "worker", code: devCode })
      .expect(200);

    expect(verifyRes.body.access_token).toBeTruthy();
    expect(verifyRes.body.refresh_token).toBeTruthy();
    expect(verifyRes.body.user).toBeTruthy();
  });
});
