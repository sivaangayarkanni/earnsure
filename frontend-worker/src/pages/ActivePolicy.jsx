import TopBar from "../components/TopBar.jsx";
import StatCard from "../components/StatCard.jsx";
import InfoCard from "../components/InfoCard.jsx";
import { policy, workerProfile } from "../data/mock.js";

export default function ActivePolicy() {
  return (
    <div className="page">
      <TopBar
        title="Active policy"
        subtitle="Your current coverage and trigger details."
      />
      <div className="stats-grid">
        <StatCard label="Policy" value={policy.plan} detail={policy.status} />
        <StatCard
          label="Weekly premium"
          value={`?${workerProfile.weeklyPremium}`}
          detail="Next debit: Monday"
        />
        <StatCard label="Risk score" value={workerProfile.riskScore} detail="Stable" />
      </div>

      <InfoCard title="Policy details">
        <div className="detail-grid">
          <div>
            <span>Policy number</span>
            <strong>{policy.policyNumber}</strong>
          </div>
          <div>
            <span>Coverage</span>
            <strong>{policy.coverage}</strong>
          </div>
          <div>
            <span>Payout cap</span>
            <strong>{policy.payoutCap}</strong>
          </div>
          <div>
            <span>Next renewal</span>
            <strong>{policy.nextRenewal}</strong>
          </div>
        </div>
      </InfoCard>
    </div>
  );
}
