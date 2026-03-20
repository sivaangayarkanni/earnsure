import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { requestOtp, verifyOtp } from "../api/client.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [workerPhone, setWorkerPhone] = useState("");
  const [workerName, setWorkerName] = useState("");
  const [workerCity, setWorkerCity] = useState("");
  const [workerCode, setWorkerCode] = useState("");
  const [workerStep, setWorkerStep] = useState("request");

  const [adminPhone, setAdminPhone] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [adminStep, setAdminStep] = useState("request");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleWorkerRequest = async () => {
    try {
      setError("");
      setMessage("");
      await requestOtp({ phone: workerPhone, role: "worker" });
      setWorkerStep("verify");
      setMessage("OTP sent to worker phone.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleWorkerVerify = async () => {
    try {
      setError("");
      setMessage("");
      const data = await verifyOtp({
        phone: workerPhone,
        role: "worker",
        code: workerCode,
        name: workerName,
        city: workerCity,
      });
      login({ role: "worker", access_token: data.access_token, refresh_token: data.refresh_token });
      navigate("/worker/profile");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAdminRequest = async () => {
    try {
      setError("");
      setMessage("");
      await requestOtp({ phone: adminPhone, role: "admin" });
      setAdminStep("verify");
      setMessage("OTP sent to admin phone.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAdminVerify = async () => {
    try {
      setError("");
      setMessage("");
      const data = await verifyOtp({
        phone: adminPhone,
        role: "admin",
        code: adminCode,
      });
      login({ role: "admin", access_token: data.access_token, refresh_token: data.refresh_token });
      navigate("/admin/overview");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <TopBar
        title="EarnSure Access"
        subtitle="Choose your role to enter the parametric insurance workspace."
        badge="Secure"
      />
      <section className="login-card">
        <div className="login-grid">
          <div className="login-panel">
            <h3>Worker login</h3>
            <p>Coverage, payouts, and zone guidance.</p>
            <label>
              Full name
              <input value={workerName} onChange={(e) => setWorkerName(e.target.value)} />
            </label>
            <label>
              City
              <input value={workerCity} onChange={(e) => setWorkerCity(e.target.value)} />
            </label>
            <label>
              Phone number
              <input value={workerPhone} onChange={(e) => setWorkerPhone(e.target.value)} />
            </label>
            {workerStep === "verify" && (
              <label>
                OTP
                <input value={workerCode} onChange={(e) => setWorkerCode(e.target.value)} />
              </label>
            )}
            {workerStep === "request" ? (
              <button className="primary" onClick={handleWorkerRequest}>
                Send OTP
              </button>
            ) : (
              <button className="primary" onClick={handleWorkerVerify}>
                Verify & Enter Worker Hub
              </button>
            )}
          </div>
          <div className="login-panel admin">
            <h3>Admin login</h3>
            <p>Portfolio, claims, fraud, and risk pools.</p>
            <label>
              Phone number
              <input value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} />
            </label>
            {adminStep === "verify" && (
              <label>
                OTP
                <input value={adminCode} onChange={(e) => setAdminCode(e.target.value)} />
              </label>
            )}
            {adminStep === "request" ? (
              <button className="primary" onClick={handleAdminRequest}>
                Send OTP
              </button>
            ) : (
              <button className="primary" onClick={handleAdminVerify}>
                Verify & Enter Admin Ops
              </button>
            )}
          </div>
        </div>
        {message && <p className="login-note">{message}</p>}
        {error && <p className="error">{error}</p>}
      </section>
    </div>
  );
}
