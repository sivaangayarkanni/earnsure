import { query } from "../db/connection.js";

const fraudModelUrl = () => process.env.FRAUD_MODEL_URL;
const fraudThreshold = Number(process.env.FRAUD_SCORE_THRESHOLD || 0.6);

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function evaluateFraud({ worker_id, claim_id }) {
  const { rows } = await query(
    `SELECT c.claim_id, c.policy_id, c.event_type, c.created_at, p.worker_id
     FROM claims c
     JOIN policies p ON c.policy_id = p.policy_id
     WHERE c.claim_id = $1`,
    [claim_id]
  );

  const claim = rows[0];
  if (!claim) {
    throw new Error("Claim not found.");
  }

  if (claim.worker_id !== worker_id) {
    return { fraud_score: 1, flagged: true };
  }

  const { rows: duplicateRows } = await query(
    `SELECT count(*)::int AS count
     FROM claims
     WHERE policy_id = $1
       AND event_type = $2
       AND claim_id <> $3
       AND created_at > now() - interval '7 days'`,
    [claim.policy_id, claim.event_type, claim_id]
  );
  const duplicateClaims = (duplicateRows[0]?.count || 0) > 0;

  const { rows: frequencyRows } = await query(
    `SELECT count(*)::int AS count
     FROM claims c
     JOIN policies p ON c.policy_id = p.policy_id
     WHERE p.worker_id = $1
       AND c.created_at > now() - interval '30 days'`,
    [worker_id]
  );
  const abnormalFrequency = (frequencyRows[0]?.count || 0) >= 3;

  const { rows: activityRows } = await query(
    `SELECT city, latitude, longitude, recorded_at, orders_received, orders_accepted, online_status
     FROM worker_activity
     WHERE worker_id = $1
     ORDER BY recorded_at DESC
     LIMIT 10`,
    [worker_id]
  );
  const lastKnownCity = activityRows[0]?.city;

  const { rows: eventRows } = await query(
    `SELECT location
     FROM risk_events
     WHERE event_type = $1
       AND timestamp > now() - interval '24 hours'
     ORDER BY timestamp DESC
     LIMIT 1`,
    [claim.event_type]
  );
  const eventCity = eventRows[0]?.location;

  const gpsMismatch =
    Boolean(lastKnownCity && eventCity) &&
    lastKnownCity.toLowerCase() !== eventCity.toLowerCase();

  let lowAcceptance = false;
  if (activityRows.length) {
    const totalReceived = activityRows.reduce((sum, row) => sum + Number(row.orders_received || 0), 0);
    const totalAccepted = activityRows.reduce((sum, row) => sum + Number(row.orders_accepted || 0), 0);
    const ratio = totalReceived > 0 ? totalAccepted / totalReceived : 1;
    lowAcceptance = ratio < 0.2 && totalReceived > 5;
  }

  let gpsSpoofing = false;
  if (activityRows.length >= 2) {
    const [latest, prev] = activityRows;
    if (
      latest.latitude != null &&
      latest.longitude != null &&
      prev.latitude != null &&
      prev.longitude != null
    ) {
      const distance = haversineKm(
        Number(latest.latitude),
        Number(latest.longitude),
        Number(prev.latitude),
        Number(prev.longitude)
      );
      const timeDiffHours =
        (new Date(latest.recorded_at).getTime() - new Date(prev.recorded_at).getTime()) /
        (1000 * 60 * 60);
      if (timeDiffHours > 0) {
        const speed = distance / timeDiffHours;
        gpsSpoofing = speed > 120;
      }
    }
  }

  const idleOnline = activityRows.length
    ? activityRows.filter((row) => row.online_status && Number(row.orders_received || 0) === 0).length >= 4
    : false;

  const features = {
    duplicate_claims: duplicateClaims ? 1 : 0,
    gps_mismatch: gpsMismatch ? 1 : 0,
    abnormal_frequency: abnormalFrequency ? 1 : 0,
    low_acceptance: lowAcceptance ? 1 : 0,
    gps_spoofing: gpsSpoofing ? 1 : 0,
    idle_online: idleOnline ? 1 : 0,
  };

  let fraud_score = 0;
  let model_version = "rules-v1";

  if (fraudModelUrl()) {
    try {
      const response = await fetch(fraudModelUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(features),
      });
      if (response.ok) {
        const data = await response.json();
        fraud_score = Number(data?.fraud_score ?? 0);
        model_version = data?.model_version || "fraud-ml";
      }
    } catch (err) {
      // fallback to rules
    }
  }

  if (!fraudModelUrl() || Number.isNaN(fraud_score) || fraud_score === 0) {
    let score = 0;
    if (duplicateClaims) score += 0.25;
    if (gpsMismatch) score += 0.2;
    if (abnormalFrequency) score += 0.2;
    if (lowAcceptance) score += 0.15;
    if (gpsSpoofing) score += 0.2;
    if (idleOnline) score += 0.1;
    fraud_score = Math.min(1, score);
    model_version = "rules-v1";
  }

  await query(
    `INSERT INTO fraud_features (worker_id, claim_id, features, model_version)
     VALUES ($1, $2, $3, $4)`,
    [worker_id, claim_id, features, model_version]
  );

  return { fraud_score, flagged: fraud_score >= fraudThreshold, model_version };
}
