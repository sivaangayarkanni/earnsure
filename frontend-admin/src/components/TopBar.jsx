export default function TopBar({ title, subtitle }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Admin pulse</p>
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      <div className="status-pill">All systems</div>
    </header>
  );
}
