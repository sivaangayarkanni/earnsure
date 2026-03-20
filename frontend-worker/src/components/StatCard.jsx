export default function StatCard({ label, value, detail }) {
  return (
    <div className="stat-card">
      <p>{label}</p>
      <h3>{value}</h3>
      {detail && <span>{detail}</span>}
    </div>
  );
}
