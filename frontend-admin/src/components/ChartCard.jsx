export default function ChartCard({ title, items, formatValue }) {
  const max = Math.max(...items.map((item) => item.value));
  return (
    <section className="chart-card">
      <h3>{title}</h3>
      <div className="chart">
        {items.map((item) => (
          <div key={item.label} className="bar-row">
            <span>{item.label}</span>
            <div className="bar">
              <div
                className="bar-fill"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            <strong>{formatValue ? formatValue(item.value) : item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
