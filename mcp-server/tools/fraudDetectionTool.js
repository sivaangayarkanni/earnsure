import { query } from "../db/pg.js";

export const definition = {
  name: "fraud_detection_tool",
  description: "Score a claim for potential fraud signals.",
  inputSchema: {
    type: "object",
    properties: {
      worker_id: { type: "string" },
      claim_id: { type: "string" },
    },
    required: ["worker_id", "claim_id"],
  },
};

export async function handler({
  worker_id,
  claim_id,
}) {
  const { rows } = await query(
    `SELECT c.*, p.policy_id, w.id AS worker_id, w.city
     FROM claims c
     JOIN policies p ON c.policy_id = p.policy_id
     JOIN workers w ON p.worker_id = w.id
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

  const { rows: eventRows } = await query(
    `SELECT location
     FROM risk_events
     WHERE event_type = $1
       AND timestamp > now() - interval '24 hours'
     ORDER BY timestamp DESC
     LIMIT 1`,
    [claim.event_type]
  );
  const recentEventLocation = eventRows[0]?.location;
  const gpsMismatch =
    recentEventLocation &&
    claim.city &&
    recentEventLocation.toLowerCase() !== claim.city.toLowerCase();

  let score = 0;
  if (duplicateClaims) score += 0.4;
  if (gpsMismatch) score += 0.3;
  if (abnormalFrequency) score += 0.3;

  score = Math.min(1, Math.max(0, score));
  const flagged = score >= 0.6;

  return { fraud_score: score, flagged };
}
