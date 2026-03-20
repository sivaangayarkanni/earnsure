import TopBar from "../components/TopBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAdminLogin = () => {
    login("admin");
    navigate("/");
  };

  return (
    <div className="page">
      <TopBar
        title="Admin access"
        subtitle="Secure operations console for EarnSure supervisors."
      />
      <section className="form-card">
        <div className="role-row">
          <span className="chip active">Admin</span>
          <span className="chip">Worker</span>
        </div>
        <label>
          Work email
          <input placeholder="ops@earnsure.com" />
        </label>
        <label>
          Access code
          <input placeholder="******" />
        </label>
        <button className="primary" onClick={handleAdminLogin}>
          Sign in as admin
        </button>
        <div className="admin-link">
          <p>Need worker tools?</p>
          <a href="http://localhost:5173" target="_blank" rel="noreferrer">
            Open Worker Hub
          </a>
        </div>
      </section>
    </div>
  );
}
