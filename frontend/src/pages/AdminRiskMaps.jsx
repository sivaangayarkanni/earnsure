import { useEffect, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { InfoCard } from "../components/Cards.jsx";
import { getAdminHeatmap } from "../api/client.js";

function riskClass(value) {
  if (value >= 0.7) return "heat high";
  if (value >= 0.4) return "heat medium";
  return "heat low";
}

export default function AdminRiskMaps() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminHeatmap()
      .then((payload) => setData(payload))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <TopBar
        title="Risk maps"
        subtitle="City risk levels and downtime hotspots in the last 24 hours."
        badge="Admin"
      />
      {error && <div className="error">{error}</div>}

      <InfoCard title="City risk map">
        {!data ? (
          <p>Loading city risk map...</p>
        ) : (
          <div className="heatmap-grid">
            {data.cityRisk?.length ? (
              data.cityRisk.map((city) => (
                <div key={city.city} className={`heatmap-tile ${riskClass(Number(city.risk_score))}`}>
                  <strong>{city.city}</strong>
                  <span>{Number(city.risk_score || 0).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p>No risk events yet.</p>
            )}
          </div>
        )}
      </InfoCard>

      <InfoCard title="Downtime heatmap">
        {!data ? (
          <p>Loading downtime hotspots...</p>
        ) : (
          <div className="heatmap-grid">
            {data.downtimeHeatmap?.length ? (
              data.downtimeHeatmap.map((spot, idx) => (
                <div
                  key={`${spot.city}-${spot.zone}-${idx}`}
                  className={`heatmap-tile ${riskClass(Math.min(Number(spot.incidents || 0) / 4, 1))}`}
                >
                  <strong>{spot.city}</strong>
                  <span>{spot.zone || "Zone"}</span>
                  <em>{spot.incidents} incidents</em>
                </div>
              ))
            ) : (
              <p>No downtime spikes yet.</p>
            )}
          </div>
        )}
      </InfoCard>
    </div>
  );
}
