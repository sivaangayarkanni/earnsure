import TopBar from "../components/TopBar.jsx";
import TableCard from "../components/TableCard.jsx";
import { fraudAlerts } from "../data/adminMock.js";

export default function FraudAlerts() {
  return (
    <div className="page">
      <TopBar
        title="Fraud alerts"
        subtitle="Flagged claims requiring investigation."
      />
      <TableCard
        title="Fraud queue"
        columns={["Alert", "Worker", "Flag", "Risk score"]}
        rows={fraudAlerts.map((alert) => ({
          id: alert.id,
          values: [alert.id, alert.worker, alert.flag, alert.score],
        }))}
      />
    </div>
  );
}
