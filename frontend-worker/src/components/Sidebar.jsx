import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Login" },
  { to: "/profile", label: "Worker profile" },
  { to: "/policy", label: "Active policy" },
  { to: "/claims", label: "Claims history" },
  { to: "/alerts", label: "Risk alerts" },
  { to: "/zones", label: "Zone suggestions" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span>EarnSure</span>
        <strong>Worker Hub</strong>
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
