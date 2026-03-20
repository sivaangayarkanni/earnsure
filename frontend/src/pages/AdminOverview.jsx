import { useEffect, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { ChartCard, StatCard, TableCard } from "../components/Cards.jsx";
import { getAdminOverview } from "../api/client.js";

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminOverview()
      .then((payload) => setData(payload))
      .catch((err) => setError(err.message));
  }, []);

  const kpis = data?.kpis || {};

  return (
    <div className="page">
      <TopBar
        title="Operations overview"
        subtitle="Portfolio health, claims movement, and worker distribution."
        badge="Admin"
      />
      {error && <div className="error">{error}</div>}
      <div className="stats-grid">
        <StatCard label="Premium revenue" value={`?${(kpis.premiumRevenue || 0).toLocaleString()}`} />
        <StatCard label="Claims paid" value={`?${(kpis.claimsPaid || 0).toLocaleString()}`} />
        <StatCard label="Pool health" value={`${Math.round((kpis.poolHealth || 0) * 100)}%`} />
        <StatCard label="Active workers" value={(kpis.workersActive || 0).toLocaleString()} />
      </div>

      <div className="chart-grid">
        <ChartCard
          title="Premium revenue"
          items={data?.premiumSeries || []}
          formatValue={(value) => `?${(value / 1000).toFixed(0)}K`}
        />
        <ChartCard
          title="Claims paid"
          items={data?.claimsSeries || []}
          formatValue={(value) => `?${(value / 1000).toFixed(0)}K`}
        />
        <ChartCard
          title="Pool health"
          items={(data?.poolHealthSeries || []).map((item) => ({
            ...item,
            value: item.value * 100,
          }))}
          formatValue={(value) => `${Math.round(value)}%`}
        />
        <ChartCard
          title="Worker distribution"
          items={(data?.workerDistribution || []).map((item) => ({
            ...item,
            value: item.value,
          }))}
          formatValue={(value) => `${Math.round(value)} workers`}
        />
        <ChartCard
          title="Traffic congestion"
          items={data?.trafficSeries || []}
          formatValue={(value) => `${Math.round(value)}%`}
        />
        <ChartCard
          title="Platform demand"
          items={data?.demandSeries || []}
          formatValue={(value) => `${Math.round(value)} idx`}
        />
        <ChartCard
          title="Downtime spikes"
          items={data?.downtimeSeries || []}
          formatValue={(value) => `${Math.round(value)} events`}
        />
      </div>

      <TableCard
        title="Portfolio health summary"
        columns={["Metric", "Value", "Target"]}
        rows={[
          { values: ["Disruption response", "92%", "> 90%"] },
          { values: ["Fraud review SLAs", "18 hrs", "< 24 hrs"] },
          { values: ["Pool reserve coverage", "1.8x", "> 1.5x"] },
        ]}
      />
    </div>
  );
}
