import TopBar from "../components/TopBar.jsx";
import InfoCard from "../components/InfoCard.jsx";
import { riskAlerts } from "../data/mock.js";

export default function RiskAlerts() {
  return (
    <div className="page">
      <TopBar
        title="Risk alerts"
        subtitle="Real-time disruptions that may affect earnings."
      />
      <InfoCard title="Active alerts">
        <div className="alert-grid">
          {riskAlerts.map((alert) => (
            <div key={alert.id} className="alert-card">
              <h4>{alert.title}</h4>
              <p>{alert.detail}</p>
              <span>{alert.severity}</span>
            </div>
          ))}
        </div>
      </InfoCard>
    </div>
  );
}
