export default function TopBar({ eyebrow = "EarnSure", title, subtitle, right }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {right && <div className="topbar-right">{right}</div>}
    </header>
  );
}
