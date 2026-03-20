import { useEffect, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { InfoCard } from "../components/Cards.jsx";
import { getWorkerZones } from "../api/client.js";

export default function ZoneSuggestions() {
  const [zones, setZones] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getWorkerZones()
      .then((data) => setZones(data.zones))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <TopBar
        title="Zone suggestions"
        subtitle="Target high-demand zones to maximize earnings."
        badge="Worker"
      />
      {error && <div className="error">{error}</div>}
      <InfoCard title="Recommended zone">
        {!zones ? (
          <p>Loading zones...</p>
        ) : (
          <div className="zone-card">
            <h4>{zones.recommended_zone || "No data"}</h4>
            <p>Expected order density</p>
            <strong>{Math.round(zones.expected_order_density || 0)} idx</strong>
          </div>
        )}
      </InfoCard>
    </div>
  );
}
