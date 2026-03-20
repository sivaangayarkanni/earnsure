import TopBar from "../components/TopBar.jsx";
import StatCard from "../components/StatCard.jsx";
import ChartCard from "../components/ChartCard.jsx";
import TableCard from "../components/TableCard.jsx";
import {
  kpis,
  premiumSeries,
  claimsSeries,
  poolHealthSeries,
  workerDistribution,
} from "../data/adminMock.js";

export default function Overview() {
  return (
    <div className="page">
      <TopBar
        title="Operations overview"
        subtitle="Live portfolio health, claims movement, and worker distribution."
      />
      <div className="stats-grid">
        <StatCard label="Premium revenue" value={`?${kpis.premiumRevenue.toLocaleString()}`} />
        <StatCard label="Claims paid" value={`?${kpis.claimsPaid.toLocaleString()}`} />
        <StatCard label="Pool health" value={`${Math.round(kpis.poolHealth * 100)}%`} />
        <StatCard label="Active workers" value={kpis.workersActive.toLocaleString()} />
      </div>

      <div className="chart-grid">
        <ChartCard
          title="Premium revenue"
          items={premiumSeries}
          formatValue={(value) => `?${(value / 1000).toFixed(0)}K`}
        />
        <ChartCard
          title="Claims paid"
          items={claimsSeries}
          formatValue={(value) => `?${(value / 1000).toFixed(0)}K`}
        />
        <ChartCard
          title="Pool health"
          items={poolHealthSeries.map((item) => ({
            ...item,
            value: item.value * 100,
          }))}
          formatValue={(value) => `${Math.round(value)}%`}
        />
        <ChartCard
          title="Worker distribution"
          items={workerDistribution.map((item) => ({
            ...item,
            value: item.value * 100,
          }))}
          formatValue={(value) => `${Math.round(value)}%`}
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
