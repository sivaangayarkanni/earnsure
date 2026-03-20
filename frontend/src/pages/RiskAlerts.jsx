import { useEffect, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { InfoCard } from "../components/Cards.jsx";
import { getWorkerAlerts } from "../api/client.js";

export default function RiskAlerts() {
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getWorkerAlerts()
      .then((data) => setAlerts(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <TopBar
        title="Risk alerts"
        subtitle="Real-time disruptions that may affect earnings."
        badge="Alert"
      />
      {error && <div className="error">{error}</div>}
      <InfoCard title="Live conditions">
        {!alerts ? (
          <p>Loading alerts...</p>
        ) : (
          <div className="alert-grid">
            <div className="alert-card">
              <h4>Weather</h4>
              <p>{alerts.weather?.weather_condition || "-"}</p>
              <span>{alerts.weather?.rainfall_mm ?? 0} mm rain</span>
            </div>
            <div className="alert-card">
              <h4>AQI</h4>
              <p>Level {alerts.aqi}</p>
              <span>Higher means worse air quality.</span>
            </div>
            <div className="alert-card">
              <h4>Risk score</h4>
              <p>{alerts.risk_score}</p>
              <span>Weekly premium ?{alerts.recommended_weekly_premium}</span>
            </div>
            <div className="alert-card">
              <h4>Traffic</h4>
              <p>{alerts.traffic ? `${alerts.traffic.congestion_level}% congestion` : "-"}</p>
              <span>{alerts.traffic ? `${alerts.traffic.speed_kph} km/h avg` : "No traffic data yet."}</span>
            </div>
            <div className="alert-card">
              <h4>Platform demand</h4>
              <p>{alerts.platform_demand?.zone || "-"}</p>
              <span>
                {alerts.platform_demand
                  ? `${alerts.platform_demand.orders_per_hour} orders/hr`
                  : "Demand feed warming up."}
              </span>
            </div>
            <div className="alert-card">
              <h4>Algorithm health</h4>
              <p>{alerts.algorithm_downtime?.is_downtime ? "Downtime detected" : "Normal"}</p>
              <span>
                {alerts.algorithm_downtime
                  ? `${alerts.algorithm_downtime.orders_received}/${alerts.algorithm_downtime.expected_orders} orders`
                  : "No activity yet."}
              </span>
            </div>
          </div>
        )}
      </InfoCard>

      <InfoCard title="Premium explainability">
        {!alerts?.premium_breakdown ? (
          <p>Premium breakdown will appear once risk data is available.</p>
        ) : (
          <div className="breakdown-grid">
            <div className="breakdown-item">
              <span>Base premium</span>
              <strong>?{alerts.premium_breakdown.base_premium}</strong>
            </div>
            <div className="breakdown-item">
              <span>Risk component</span>
              <strong>?{alerts.premium_breakdown.risk_component}</strong>
            </div>
            <div className="breakdown-item">
              <span>Weather adjustment</span>
              <strong>?{alerts.premium_breakdown.weather_adjustment}</strong>
            </div>
            <div className="breakdown-item">
              <span>AQI adjustment</span>
              <strong>?{alerts.premium_breakdown.aqi_adjustment}</strong>
            </div>
            <div className="breakdown-item">
              <span>Temperature adjustment</span>
              <strong>?{alerts.premium_breakdown.temperature_adjustment}</strong>
            </div>
            <div className="breakdown-item total">
              <span>Total weekly premium</span>
              <strong>?{alerts.premium_breakdown.total}</strong>
            </div>
          </div>
        )}
      </InfoCard>
    </div>
  );
}
