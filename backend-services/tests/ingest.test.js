import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApp } from "../src/app.js";
import { query, closePool } from "../src/db/pg.js";

process.env.INGEST_API_KEY = "test_ingest_key";
process.env.TWILIO_DISABLED = "true";
process.env.ACCESS_TOKEN_SECRET = "test_access";
process.env.REFRESH_TOKEN_SECRET = "test_refresh";

const app = createApp();

let workerId = null;

describe("Ingestion endpoints", () => {
  beforeAll(async () => {
    const { rows } = await query(
      `INSERT INTO workers (name, phone, city, platform, risk_score)
       VALUES ('Test Worker', '+910000000000', 'Bengaluru', 'Gig', 0.2)
       RETURNING id`
    );
    workerId = rows[0].id;
  });

  afterAll(async () => {
    await closePool();
  });

  it("ingests platform demand", async () => {
    await request(app)
      .post("/ingest/demand")
      .set("x-ingest-key", "test_ingest_key")
      .send({
        city: "Bengaluru",
        zones: [{ zone: "Indiranagar", orders_per_hour: 12, active_workers: 8, demand_index: 20 }],
      })
      .expect(200);
  });

  it("ingests worker activity", async () => {
    await request(app)
      .post("/ingest/activity")
      .set("x-ingest-key", "test_ingest_key")
      .send({
        worker_id: workerId,
        city: "Bengaluru",
        zone: "Indiranagar",
        online_status: true,
        orders_received: 5,
        orders_accepted: 4,
        earnings: 260,
      })
      .expect(200);
  });

  it("ingests traffic signals", async () => {
    await request(app)
      .post("/ingest/traffic")
      .set("x-ingest-key", "test_ingest_key")
      .send({
        city: "Bengaluru",
        zone: "Indiranagar",
        congestion_level: 55,
        speed_kph: 22,
        travel_time_index: 1.4,
      })
      .expect(200);
  });
});

describe("Admin alerts", () => {
  it("returns alert summary", async () => {
    await request(app)
      .get("/admin/alerts")
      .set("Authorization", "Bearer invalid")
      .expect(401);
  });
});
