import TopBar from "../components/TopBar.jsx";
import StatCard from "../components/StatCard.jsx";
import InfoCard from "../components/InfoCard.jsx";
import NotificationCard from "../components/NotificationCard.jsx";
import { workerProfile, payoutNotifications } from "../data/mock.js";

export default function WorkerProfile() {
  return (
    <div className="page">
      <TopBar
        title="Worker profile"
        subtitle="Personal coverage insights and payout updates."
      />
      <div className="stats-grid">
        <StatCard label="Risk score" value={workerProfile.riskScore} detail="Low" />
        <StatCard
          label="Weekly premium"
          value={`?${workerProfile.weeklyPremium}`}
          detail="Auto-deducted"
        />
        <StatCard label="Platform" value={workerProfile.platform} />
      </div>

      <InfoCard title="Profile details">
        <div className="detail-grid">
          <div>
            <span>Name</span>
            <strong>{workerProfile.name}</strong>
          </div>
          <div>
            <span>City</span>
            <strong>{workerProfile.city}</strong>
          </div>
          <div>
            <span>Phone</span>
            <strong>{workerProfile.phone}</strong>
          </div>
        </div>
      </InfoCard>

      <InfoCard title="Payout notifications">
        <div className="notification-list">
          {payoutNotifications.map((note) => (
            <NotificationCard key={note.id} {...note} />
          ))}
        </div>
      </InfoCard>
    </div>
  );
}
