export default function TopBar({ title, subtitle }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Daily pulse</p>
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      <div className="status-pill">Live coverage</div>
    </header>
  );
}
