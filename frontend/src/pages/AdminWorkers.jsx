import { useEffect, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { TableCard } from "../components/Cards.jsx";
import { getAdminWorkers } from "../api/client.js";

export default function AdminWorkers() {
  const [workers, setWorkers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminWorkers()
      .then((data) => setWorkers(data.workers || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <TopBar
        title="Worker directory"
        subtitle="Search and monitor active gig workers."
        badge="Admin"
      />
      {error && <div className="error">{error}</div>}
      <TableCard
        title="Active workers"
        columns={["Worker", "City", "Platform", "Risk"]}
        rows={workers.map((worker) => ({
          id: worker.id,
          values: [worker.name, worker.city, worker.platform, worker.risk_score],
        }))}
      />
    </div>
  );
}
