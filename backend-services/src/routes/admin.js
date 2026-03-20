import { Router } from "express";
import { query } from "../db/pg.js";
import { callMcpTool } from "../mcp/client.js";

const router = Router();

router.get("/overview", async (req, res, next) => {
  try {
    const [{ rows: workerRows }, { rows: policyRows }, { rows: claimRows }, { rows: poolRows }] =
      await Promise.all([
        query("SELECT count(*)::int AS count FROM workers"),
        query("SELECT sum(weekly_premium)::numeric AS sum FROM policies"),
        query(
          "SELECT sum(payout_amount)::numeric AS sum FROM claims WHERE claim_status IN ('approved','paid')"
        ),
        query("SELECT avg(total_balance / NULLIF(reserve_fund + total_balance, 0)) AS health FROM pools"),
      ]);

    const premiumRevenue = Number(policyRows[0]?.sum || 0);
    const claimsPaid = Number(claimRows[0]?.sum || 0);
    const poolHealth = Number(poolRows[0]?.health || 0.8);
    const workersActive = workerRows[0]?.count || 0;

    const { rows: premiumSeries } = await query(
      `SELECT to_char(date_trunc('week', start_date), '"W"IW') AS label,
              sum(weekly_premium)::numeric AS value
       FROM policies
       GROUP BY 1
       ORDER BY 1 DESC
       LIMIT 5`
    );

    const { rows: claimsSeries } = await query(
      `SELECT to_char(date_trunc('week', created_at), '"W"IW') AS label,
              sum(payout_amount)::numeric AS value
       FROM claims
       GROUP BY 1
       ORDER BY 1 DESC
       LIMIT 5`
    );

    const { rows: poolHealthSeries } = await query(
      `SELECT city AS label,
              CASE WHEN (reserve_fund + total_balance) = 0 THEN 0
                   ELSE total_balance / (reserve_fund + total_balance) END AS value
       FROM pools
       ORDER BY city ASC
       LIMIT 4`
    );

    const { rows: workerDistribution } = await query(
      `SELECT city AS label, count(*)::numeric AS value
       FROM workers
       GROUP BY city
       ORDER BY value DESC
       LIMIT 4`
    );

    const { rows: trafficSeries } = await query(
      `SELECT city AS label, avg(congestion_level)::numeric AS value
       FROM traffic_events
       WHERE recorded_at >= now() - interval '6 hours'
       GROUP BY city
       ORDER BY value DESC
       LIMIT 4`
    );

    const { rows: demandSeries } = await query(
      `SELECT city AS label, avg(demand_index)::numeric AS value
       FROM platform_demand
       WHERE recorded_at >= now() - interval '6 hours'
       GROUP BY city
       ORDER BY value DESC
       LIMIT 4`
    );

    const { rows: downtimeSeries } = await query(
      `SELECT city AS label, count(*)::numeric AS value
       FROM algorithm_events
       WHERE recorded_at >= now() - interval '24 hours'
         AND is_downtime = true
       GROUP BY city
       ORDER BY value DESC
       LIMIT 4`
    );

    res.json({
      kpis: { premiumRevenue, claimsPaid, poolHealth, workersActive },
      premiumSeries,
      claimsSeries,
      poolHealthSeries,
      workerDistribution,
      trafficSeries,
      demandSeries,
      downtimeSeries,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/workers", async (req, res, next) => {
  try {
    const { rows } = await query(
      "SELECT id, name, city, platform, risk_score FROM workers ORDER BY created_at DESC"
    );
    res.json({ workers: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/disruptions", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT location AS city, event_type AS type, severity, timestamp
       FROM risk_events
       UNION ALL
       SELECT city, 'traffic' AS type, congestion_level AS severity, recorded_at AS timestamp
       FROM traffic_events
       UNION ALL
       SELECT city, 'algorithm_downtime' AS type, order_drop_percentage AS severity, recorded_at AS timestamp
       FROM algorithm_events
       WHERE is_downtime = true
       ORDER BY timestamp DESC
       LIMIT 30`
    );
    res.json({ disruptions: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/claims", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT c.claim_id, c.event_type, c.claim_status, c.payout_amount,
              w.name AS worker_name
       FROM claims c
       JOIN policies p ON c.policy_id = p.policy_id
       JOIN workers w ON p.worker_id = w.id
       ORDER BY c.created_at DESC
       LIMIT 50`
    );
    res.json({ claims: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/fraud", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT c.claim_id, p.worker_id
       FROM claims c
       JOIN policies p ON c.policy_id = p.policy_id
       ORDER BY c.created_at DESC
       LIMIT 25`
    );

    const alerts = [];
    for (const row of rows) {
      const result = await callMcpTool("fraud_detection_tool", {
        worker_id: row.worker_id,
        claim_id: row.claim_id,
      });
      if (result.fraud_score >= 0.6) {
        alerts.push({
          claim_id: row.claim_id,
          worker_id: row.worker_id,
          fraud_score: result.fraud_score,
        });
      }
    }

    res.json({ alerts });
  } catch (err) {
    next(err);
  }
});

router.get("/pools", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT pool_id, city, total_balance, reserve_fund
       FROM pools
       ORDER BY city ASC`
    );
    res.json({ pools: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/downtime", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT a.event_id, a.city, a.zone, a.order_drop_percentage, a.recorded_at,
              w.name AS worker_name
       FROM algorithm_events a
       JOIN workers w ON a.worker_id = w.id
       WHERE a.is_downtime = true
       ORDER BY a.recorded_at DESC
       LIMIT 40`
    );
    res.json({ downtime: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/heatmap", async (req, res, next) => {
  try {
    const { rows: cityRisk } = await query(
      `WITH combined AS (
         SELECT location AS city,
                CASE
                  WHEN event_type = 'weather' THEN LEAST(severity / 50, 1)
                  WHEN event_type = 'aqi' THEN LEAST(severity / 5, 1)
                  WHEN event_type = 'algorithm_downtime' THEN LEAST(severity / 100, 1)
                  ELSE LEAST(severity, 1)
                END AS normalized
         FROM risk_events
         WHERE timestamp >= now() - interval '24 hours'
         UNION ALL
         SELECT city,
                LEAST(congestion_level / 100, 1) AS normalized
         FROM traffic_events
         WHERE recorded_at >= now() - interval '24 hours'
       )
       SELECT city, avg(normalized)::numeric AS risk_score
       FROM combined
       GROUP BY city
       ORDER BY risk_score DESC`
    );

    const { rows: downtimeHeatmap } = await query(
      `SELECT city, zone, count(*)::int AS incidents, avg(order_drop_percentage)::numeric AS avg_drop
       FROM algorithm_events
       WHERE is_downtime = true
         AND recorded_at >= now() - interval '24 hours'
       GROUP BY city, zone
       ORDER BY incidents DESC
       LIMIT 30`
    );

    res.json({ cityRisk, downtimeHeatmap });
  } catch (err) {
    next(err);
  }
});

router.get("/alerts", async (req, res, next) => {
  try {
    const { rows: riskAlerts } = await query(
      `SELECT location AS city, event_type, severity, timestamp
       FROM risk_events
       WHERE timestamp >= now() - interval '24 hours'
         AND (
           (event_type = 'weather' AND severity >= 20)
           OR (event_type = 'aqi' AND severity >= 4)
           OR (event_type = 'algorithm_downtime' AND severity >= 50)
         )
       ORDER BY timestamp DESC
       LIMIT 10`
    );

    const { rows: downtimeCounts } = await query(
      `SELECT city, count(*)::int AS incidents
       FROM algorithm_events
       WHERE is_downtime = true
         AND recorded_at >= now() - interval '24 hours'
       GROUP BY city
       ORDER BY incidents DESC
       LIMIT 5`
    );

    const { rows: pendingClaims } = await query(
      `SELECT count(*)::int AS count
       FROM claims
       WHERE claim_status IN ('submitted', 'approved')`
    );

    res.json({
      riskAlerts,
      downtimeCounts,
      pendingClaims: pendingClaims[0]?.count || 0,
    });
  } catch (err) {
    next(err);
  }
});

function parseMonthParam(value) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  return value;
}

function monthRange(monthStr) {
  const [year, month] = monthStr.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

router.get("/reports/payouts", async (req, res, next) => {
  try {
    const monthParam = parseMonthParam(req.query.month);
    const today = new Date();
    const defaultMonth = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}`;
    const month = monthParam || defaultMonth;
    const { start, end } = monthRange(month);

    const { rows } = await query(
      `SELECT t.transaction_id, t.created_at, t.amount, t.status, t.payment_method,
              t.provider, t.provider_reference, w.name AS worker_name, w.phone, c.claim_id
       FROM transactions t
       LEFT JOIN workers w ON t.worker_id = w.id
       LEFT JOIN claims c ON t.claim_id = c.claim_id
       WHERE t.created_at >= $1 AND t.created_at < $2
       ORDER BY t.created_at DESC`,
      [start.toISOString(), end.toISOString()]
    );

    const format = (req.query.format || "csv").toLowerCase();
    if (format === "json") {
      res.json({ month, payouts: rows });
      return;
    }

    const header = [
      "transaction_id",
      "created_at",
      "amount",
      "status",
      "payment_method",
      "provider",
      "provider_reference",
      "worker_name",
      "phone",
      "claim_id",
    ];
    const csvRows = rows.map((row) =>
      header
        .map((key) => {
          const value = row[key];
          if (value === null || value === undefined) return "";
          return `"${String(value).replace(/"/g, '""')}"`
        })
        .join(",")
    );
    res.setHeader("Content-Type", "text/csv");
    res.send([header.join(","), ...csvRows].join("\n"));
  } catch (err) {
    next(err);
  }
});

router.get("/reports/audit", async (req, res, next) => {
  try {
    const monthParam = parseMonthParam(req.query.month);
    const today = new Date();
    const defaultMonth = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}`;
    const month = monthParam || defaultMonth;
    const { start, end } = monthRange(month);

    const { rows } = await query(
      `SELECT audit_id, actor_type, actor_id, action, entity_type, entity_id, created_at
       FROM audit_logs
       WHERE created_at >= $1 AND created_at < $2
       ORDER BY created_at DESC
       LIMIT 1000`,
      [start.toISOString(), end.toISOString()]
    );

    res.json({ month, audits: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
