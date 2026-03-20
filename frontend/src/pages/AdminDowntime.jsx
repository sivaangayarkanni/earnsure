import { useEffect, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { TableCard } from "../components/Cards.jsx";
import { getAdminDowntime } from "../api/client.js";

export default function AdminDowntime() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminDowntime()
      .then((data) => setEvents(data.downtime || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <TopBar
        title="Algorithm downtime"
        subtitle="Detected order drops when workers remain online."
        badge="Admin"
      />
      {error && <div className="error">{error}</div>}
      <TableCard
        title="Downtime events"
        columns={["Worker", "City", "Zone", "Drop %", "Time"]}
        rows={events.map((event) => ({
          id: event.event_id,
          values: [
            event.worker_name || "-",
            event.city,
            event.zone || "-",
            `${Number(event.order_drop_percentage || 0).toFixed(1)}%`,
            new Date(event.recorded_at).toLocaleString(),
          ],
        }))}
      />
    </div>
  );
}
