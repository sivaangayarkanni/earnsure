export default function InfoCard({ title, children }) {
  return (
    <section className="info-card">
      <h3>{title}</h3>
      <div className="info-body">{children}</div>
    </section>
  );
}
