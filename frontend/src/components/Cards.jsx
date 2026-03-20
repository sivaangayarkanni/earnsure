export function StatCard({ icon, label, value, detail, detailType }) {
  return (
    <div className="stat-card">
      {icon && <span className="stat-icon">{icon}</span>}
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {detail && (
        <div className={`stat-detail ${detailType ? `pill pill-${detailType}` : ""}`}>
          {detail}
        </div>
      )}
    </div>
  );
}

export function InfoCard({ title, action, children }) {
  return (
    <section className="info-card">
      <div className="info-card-header">
        <h3>{title}</h3>
        {action && action}
      </div>
      {children}
    </section>
  );
}

export function ChartCard({ title, items, formatValue }) {
  const max = items.length ? Math.max(...items.map((i) => i.value), 1) : 1;
  return (
    <section className="chart-card">
      <h3>{title}</h3>
      <div className="chart">
        {items.map((item) => (
          <div key={item.label} className="bar-row">
            <span className="bar-label">{item.label}</span>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
            <span className="bar-value">{formatValue ? formatValue(item.value) : item.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TableCard({ title, action, columns, rows, children }) {
  return (
    <section className="table-card">
      <div className="table-card-header">
        <h3>{title}</h3>
        {action && action}
      </div>
      {rows ? (
        <div className="table">
          <div className="table-row">
            {columns.map((col) => (
              <strong key={col}>{col}</strong>
            ))}
          </div>
          {rows.map((row, idx) => (
            <div key={row.id || idx} className="table-row">
              {row.values.map((value, index) => (
                <span key={index}>{value}</span>
              ))}
            </div>
          ))}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

export function NotificationCard({ title, description, time, type }) {
  return (
    <div className={`notification ${type || ""}`}>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <time>{time}</time>
    </div>
  );
}
