export default function TableCard({ title, columns, rows }) {
  return (
    <section className="table-card">
      <h3>{title}</h3>
      <div className="table">
        <div className="table-row header">
          {columns.map((col) => (
            <span key={col}>{col}</span>
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
    </section>
  );
}
