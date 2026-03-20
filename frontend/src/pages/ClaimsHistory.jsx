import { useEffect, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { InfoCard } from "../components/Cards.jsx";
import { getWorkerClaims } from "../api/client.js";

export default function ClaimsHistory() {
  const [claims, setClaims] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getWorkerClaims()
      .then((data) => setClaims(data.claims || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <TopBar
        title="Claims history"
        subtitle="Track every claim and payout status."
        badge="Worker"
      />
      {error && <div className="error">{error}</div>}
      <InfoCard title="Recent claims">
        <div className="table">
          {claims.map((claim) => (
            <div key={claim.claim_id} className="table-row">
              <strong>{claim.claim_id}</strong>
              <span>{claim.event_type}</span>
              <span>{new Date(claim.created_at).toLocaleDateString()}</span>
              <span>{claim.claim_status}</span>
              <span>?{claim.payout_amount}</span>
            </div>
          ))}
          {claims.length === 0 && <p>No claims yet.</p>}
        </div>
      </InfoCard>
    </div>
  );
}
