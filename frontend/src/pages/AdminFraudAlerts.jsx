import { useEffect, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { TableCard } from "../components/Cards.jsx";
import { getAdminFraud } from "../api/client.js";

export default function AdminFraudAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminFraud()
      .then((data) => setAlerts(data.alerts || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <TopBar
        title="Fraud alerts"
        subtitle="Flagged claims requiring investigation."
        badge="Admin"
      />
      {error && <div className="error">{error}</div>}
      <TableCard
        title="Fraud queue"
        columns={["Claim", "Worker", "Risk score"]}
        rows={alerts.map((alert) => ({
          id: alert.claim_id,
          values: [alert.claim_id, alert.worker_id, alert.fraud_score],
        }))}
      />
    </div>
  );
}
