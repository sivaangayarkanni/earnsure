import { useEffect, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { TableCard } from "../components/Cards.jsx";
import { getAdminClaims } from "../api/client.js";

export default function AdminClaims() {
  const [claims, setClaims] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminClaims()
      .then((data) => setClaims(data.claims || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <TopBar
        title="Claims management"
        subtitle="Review, approve, or deny claims in one place."
        badge="Admin"
      />
      {error && <div className="error">{error}</div>}
      <TableCard
        title="Claims queue"
        columns={["Claim", "Worker", "Event", "Status", "Amount"]}
        rows={claims.map((claim) => ({
          id: claim.claim_id,
          values: [
            claim.claim_id,
            claim.worker_name,
            claim.event_type,
            claim.claim_status,
            `?${claim.payout_amount}`,
          ],
        }))}
      />
    </div>
  );
}
