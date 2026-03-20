import client from "prom-client";
import { query } from "../db/pg.js";

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.05, 0.1, 0.2, 0.3, 0.5, 1, 2, 5],
});

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
});

const claimsLastHour = new client.Gauge({
  name: "earnsure_claims_last_hour",
  help: "Claims created in the last hour",
});

const fraudFlagsLastHour = new client.Gauge({
  name: "earnsure_fraud_flags_last_hour",
  help: "Fraud alerts created in the last hour",
});

const payoutsLastHour = new client.Gauge({
  name: "earnsure_payouts_last_hour",
  help: "Completed payouts in the last hour",
});

const downtimeLastHour = new client.Gauge({
  name: "earnsure_downtime_last_hour",
  help: "Algorithm downtime incidents in the last hour",
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(claimsLastHour);
register.registerMetric(fraudFlagsLastHour);
register.registerMetric(payoutsLastHour);
register.registerMetric(downtimeLastHour);

async function updateBusinessMetrics() {
  try {
    const [{ rows: claimRows }, { rows: fraudRows }, { rows: payoutRows }, { rows: downtimeRows }] =
      await Promise.all([
        query("SELECT count(*)::int AS count FROM claims WHERE created_at > now() - interval '1 hour'"),
        query(
          "SELECT count(*)::int AS count FROM notifications WHERE type = 'fraud' AND created_at > now() - interval '1 hour'"
        ),
        query(
          "SELECT count(*)::int AS count FROM transactions WHERE status = 'completed' AND created_at > now() - interval '1 hour'"
        ),
        query(
          "SELECT count(*)::int AS count FROM algorithm_events WHERE is_downtime = true AND recorded_at > now() - interval '1 hour'"
        ),
      ]);

    claimsLastHour.set(claimRows[0]?.count || 0);
    fraudFlagsLastHour.set(fraudRows[0]?.count || 0);
    payoutsLastHour.set(payoutRows[0]?.count || 0);
    downtimeLastHour.set(downtimeRows[0]?.count || 0);
  } catch (err) {
    // avoid crashing metrics on transient DB failures
  }
}

let metricsTimer = null;

export function startMetricsUpdater() {
  if (metricsTimer) return;
  updateBusinessMetrics();
  metricsTimer = setInterval(updateBusinessMetrics, 60 * 1000);
}

export function metricsMiddleware(req, res, next) {
  if (req.path === "/metrics") {
    return next();
  }
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    const route = req.route?.path || req.path || "unknown";
    const labels = { method: req.method, route, status: res.statusCode };
    httpRequestsTotal.inc(labels);
    end(labels);
  });
  next();
}

export async function metricsEndpoint(req, res) {
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
}
