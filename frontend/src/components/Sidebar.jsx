import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const workerLinks = [
  { to: "/worker/profile", label: "My Profile", icon: "P" },
  { to: "/worker/policy", label: "Active Policy", icon: "A" },
  { to: "/worker/claims", label: "Claims History", icon: "C" },
  { to: "/worker/alerts", label: "Risk Alerts", icon: "R" },
  { to: "/worker/stability", label: "Income Stability", icon: "I" },
  { to: "/worker/zones", label: "Zone Suggestions", icon: "Z" },
];

const adminLinks = [
  { to: "/admin/overview", label: "Overview", icon: "O" },
  { to: "/admin/workers", label: "Workers", icon: "W" },
  { to: "/admin/disruptions", label: "Disruptions", icon: "D" },
  { to: "/admin/alerts", label: "Alerts", icon: "!" },
  { to: "/admin/maps", label: "Risk Maps", icon: "M" },
  { to: "/admin/downtime", label: "Downtime", icon: "T" },
  { to: "/admin/claims", label: "Claims", icon: "C" },
  { to: "/admin/fraud", label: "Fraud Alerts", icon: "F" },
  { to: "/admin/pools", label: "Risk Pools", icon: "P" },
];

export default function Sidebar() {
  const { role, logout } = useAuth();
  const isAdmin = role === "admin";
  const links = isAdmin ? adminLinks : workerLinks;
  const initial = isAdmin ? "A" : "W";
  const name = isAdmin ? "Admin Ops" : "Worker Hub";
  const roleLabel = isAdmin ? "Administrator" : "Gig Worker";

  return (
    <aside className={`sidebar ${isAdmin ? "admin" : ""}`}>
      <div className="brand">
        <div className="brand-tag">EarnSure</div>
        <div className="brand-name">Earn<span style={{ opacity: 0.5 }}>Sure</span></div>
        <div className="brand-sub">Income Protection Platform</div>
      </div>

      <div className="nav-section">{name}</div>

      <nav style={{ display: "grid", gap: "4px" }}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            <span className="nav-icon">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="worker-chip">
          <div className="worker-avatar">{initial}</div>
          <div>
            <div className="worker-chip-name">{name}</div>
            <div className="worker-chip-role">{roleLabel}</div>
          </div>
        </div>
        <button className="ghost-btn" onClick={logout}>Log out</button>
      </div>
    </aside>
  );
}
