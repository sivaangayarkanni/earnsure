import { useEffect, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { StatCard, InfoCard } from "../components/Cards.jsx";
import { getWorkerStability } from "../api/client.js";

export default function IncomeStability() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getWorkerStability()
      .then((res) => setData(res))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <TopBar
        title="Income stability"
        subtitle="7-day forecast based on recent earnings and live demand signals."
        badge="Forecast"
      />
      {error && <div className="error">{error}</div>}
      <div className="stats-grid">
        <StatCard label="Stability score" value={data?.stability_score ?? "-"} detail="0 = volatile, 1 = stable" />
        <StatCard label="Demand boost" value={data?.demand_boost ?? "-"} detail="Live platform demand factor" />
        <StatCard label="Risk adjustment" value={data?.risk_adjustment ?? "-"} detail="Weather + AQI impact" />
      </div>

      <InfoCard title="7-day earnings outlook">
        {!data ? (
          <p>Loading forecast...</p>
        ) : (
          <div className="forecast-grid">
            {data.forecast?.map((day) => (
              <div key={day.date} className="forecast-item">
                <span>{day.date}</span>
                <strong>?{day.expected_income}</strong>
              </div>
            ))}
          </div>
        )}
      </InfoCard>

      <InfoCard title="Recommendations">
        {!data ? (
          <p>Loading recommendations...</p>
        ) : (
          <ul className="recommendation-list">
            {data.recommendations?.map((rec) => (
              <li key={rec}>{rec}</li>
            ))}
          </ul>
        )}
      </InfoCard>
    </div>
  );
}
