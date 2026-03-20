import { useEffect, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { InfoCard, TableCard, StatCard } from "../components/Cards.jsx";
import { getAdminAlerts } from "../api/client.js";

export default function AdminAlerts() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminAlerts()
      .then((payload) => setData(payload))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <TopBar
        title="Operations alerts"
        subtitle="High severity signals, downtime spikes, and pending claims."
        badge="Admin"
      />
      {error && <div className="error">{error}</div>}

      <div className="stats-grid">
        <StatCard label="Pending claims" value={data?.pendingClaims ?? 0} detail="Needs review" />
        <StatCard
          label="Downtime spikes"
          value={(data?.downtimeCounts || []).reduce((sum, row) => sum + Number(row.incidents || 0), 0)}
          detail="Last 24 hours"
        />
        <StatCard
          label="High risk alerts"
          value={data?.riskAlerts?.length || 0}
          detail="Weather + AQI + downtime"
        />
      </div>

      <InfoCard title="Downtime hotspots">
        {!data ? (
          <p>Loading downtime summary...</p>
        ) : (
          <div className="heatmap-grid compact">
            {(data.downtimeCounts || []).map((row) => (
              <div key={row.city} className="heatmap-tile heat medium">
                <strong>{row.city}</strong>
                <span>{row.incidents} incidents</span>
              </div>
            ))}
          </div>
        )}
      </InfoCard>

      <TableCard
        title="High severity risk alerts"
        columns={["Type", "City", "Severity", "Time"]}
        rows={(data?.riskAlerts || []).map((alert, idx) => ({
          id: `${alert.city}-${idx}`,
          values: [
            alert.event_type,
            alert.city,
            Number(alert.severity || 0).toFixed(2),
            new Date(alert.timestamp).toLocaleString(),
          ],
        }))}
      />
    </div>
  );
}
