import TopBar from "../components/TopBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleWorkerLogin = () => {
    login("worker");
    navigate("/profile");
  };

  return (
    <div className="page">
      <TopBar
        title="Welcome back"
        subtitle="Secure access to your coverage, payouts, and risk alerts."
      />
      <section className="form-card">
        <div className="role-row">
          <span className="chip active">Worker</span>
          <span className="chip">Admin</span>
        </div>
        <label>
          Phone number
          <input placeholder="+91 98765 43210" />
        </label>
        <label>
          One-time PIN
          <input placeholder="123456" />
        </label>
        <button className="primary" onClick={handleWorkerLogin}>
          Sign in as worker
        </button>
        <div className="admin-link">
          <p>Are you an admin?</p>
          <a href="http://localhost:5174" target="_blank" rel="noreferrer">
            Open Admin Console
          </a>
        </div>
      </section>
    </div>
  );
}
