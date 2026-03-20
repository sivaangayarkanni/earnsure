import { useEffect, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { TableCard } from "../components/Cards.jsx";
import { getAdminDisruptions } from "../api/client.js";

export default function AdminDisruptions() {
  const [disruptions, setDisruptions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminDisruptions()
      .then((data) => setDisruptions(data.disruptions || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <TopBar
        title="Disruption monitor"
        subtitle="Track weather, AQI, and safety signals."
        badge="Admin"
      />
      {error && <div className="error">{error}</div>}
      <TableCard
        title="Live disruptions"
        columns={["Type", "City", "Severity", "Time"]}
        rows={disruptions.map((event) => ({
          id: `${event.type}-${event.timestamp}`,
          values: [event.type, event.city, event.severity, new Date(event.timestamp).toLocaleString()],
        }))}
      />
    </div>
  );
}
