import { useEffect, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { StatCard, InfoCard, NotificationCard } from "../components/Cards.jsx";
import {
  getWorkerClaims,
  getWorkerPolicy,
  getWorkerProfile,
  getWorkerNotifications,
  updateWorkerProfile,
} from "../api/client.js";

export default function WorkerProfile() {
  const [profile, setProfile] = useState(null);
  const [claims, setClaims] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [upiId, setUpiId] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([getWorkerProfile(), getWorkerClaims(), getWorkerPolicy(), getWorkerNotifications()])
      .then(([profileData, claimsData, policyData, notificationData]) => {
        setProfile(profileData.worker);
        setClaims(claimsData.claims || []);
        setPolicy(policyData.policy);
        setUpiId(profileData.worker?.upi_id || "");
        setNotifications(notificationData.notifications || []);
      })
      .catch((err) => setError(err.message));
  }, []);

  const notificationCards = notifications.map((note) => ({
    id: note.id,
    title: note.type.toUpperCase(),
    description: `${note.message}${note.channel ? ` (${note.channel})` : ""}`,
    time: new Date(note.created_at).toLocaleDateString(),
    type: note.type === "fraud" ? "warning" : note.type === "payout" ? "success" : "",
  }));

  const handleUpiSave = async () => {
    try {
      setError("");
      setMessage("");
      const result = await updateWorkerProfile({ upi_id: upiId });
      setProfile(result.worker);
      setMessage("UPI ID updated.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <TopBar
        title="Worker profile"
        subtitle="Personal coverage insights and payout updates."
        badge="Worker"
      />
      {error && <div className="error">{error}</div>}
      {message && <div className="info-card">{message}</div>}
      <div className="stats-grid">
        <StatCard label="Risk score" value={profile?.risk_score ?? "-"} detail="Live" />
        <StatCard
          label="Weekly premium"
          value={policy ? `?${policy.weekly_premium}` : "-"}
          detail="Auto-deducted"
        />
        <StatCard label="Platform" value={profile?.platform ?? "-"} />
      </div>

      <InfoCard title="Profile details">
        <div className="detail-grid">
          <div>
            <span>Name</span>
            <strong>{profile?.name ?? "-"}</strong>
          </div>
          <div>
            <span>City</span>
            <strong>{profile?.city ?? "-"}</strong>
          </div>
          <div>
            <span>Phone</span>
            <strong>{profile?.phone ?? "-"}</strong>
          </div>
        </div>
      </InfoCard>

      <InfoCard title="UPI payout settings">
        <div className="detail-grid">
          <div>
            <span>UPI ID</span>
            <input value={upiId} onChange={(e) => setUpiId(e.target.value)} />
          </div>
          <div>
            <button className="primary" onClick={handleUpiSave}>
              Save UPI ID
            </button>
          </div>
        </div>
      </InfoCard>

      <InfoCard title="Alerts & notifications">
        <div className="notification-list">
          {notificationCards.length === 0 ? (
            <p>No recent alerts.</p>
          ) : (
            notificationCards.map((note) => (
              <NotificationCard key={note.id} {...note} />
            ))
          )}
        </div>
      </InfoCard>
    </div>
  );
}
