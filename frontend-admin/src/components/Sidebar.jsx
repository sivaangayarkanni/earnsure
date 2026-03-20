import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Overview" },
  { to: "/workers", label: "Workers" },
  { to: "/disruptions", label: "Disruptions" },
  { to: "/claims", label: "Claims" },
  { to: "/fraud", label: "Fraud alerts" },
  { to: "/pools", label: "Risk pools" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span>EarnSure</span>
        <strong>Admin Ops</strong>
      </div>
      <nav className="nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
