import { useEffect, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { StatCard, InfoCard } from "../components/Cards.jsx";
import { getWorkerPolicy, getWorkerProfile, getWorkerPremiumBreakdown } from "../api/client.js";

export default function ActivePolicy() {
  const [policy, setPolicy] = useState(null);
  const [profile, setProfile] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getWorkerPolicy(), getWorkerProfile(), getWorkerPremiumBreakdown()])
      .then(([policyData, profileData, breakdownData]) => {
        setPolicy(policyData.policy);
        setProfile(profileData.worker);
        setBreakdown(breakdownData.premium_breakdown);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <TopBar
        title="Active policy"
        subtitle="Your current coverage and trigger details."
        badge={policy?.status || "Inactive"}
      />
      {error && <div className="error">{error}</div>}
      <div className="stats-grid">
        <StatCard label="Plan" value={policy?.plan_type || "-"} detail={policy?.status || ""} />
        <StatCard
          label="Weekly premium"
          value={policy ? `?${policy.weekly_premium}` : "-"}
          detail="Next debit: Monday"
        />
        <StatCard label="Risk score" value={profile?.risk_score ?? "-"} detail="Stable" />
      </div>

      <InfoCard title="Policy details">
        <div className="detail-grid">
          <div>
            <span>Policy number</span>
            <strong>{policy?.policy_id || "-"}</strong>
          </div>
          <div>
            <span>Coverage</span>
            <strong>{policy?.coverage_details?.coverage || "-"}</strong>
          </div>
          <div>
            <span>Start date</span>
            <strong>{policy?.start_date || "-"}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{policy?.status || "-"}</strong>
          </div>
        </div>
      </InfoCard>

      <InfoCard title="Premium breakdown">
        {!breakdown ? (
          <p>Loading premium breakdown...</p>
        ) : (
          <div className="breakdown-grid">
            <div className="breakdown-item">
              <span>Base premium</span>
              <strong>?{breakdown.base_premium}</strong>
            </div>
            <div className="breakdown-item">
              <span>Risk component</span>
              <strong>?{breakdown.risk_component}</strong>
            </div>
            <div className="breakdown-item">
              <span>Weather adjustment</span>
              <strong>?{breakdown.weather_adjustment}</strong>
            </div>
            <div className="breakdown-item">
              <span>AQI adjustment</span>
              <strong>?{breakdown.aqi_adjustment}</strong>
            </div>
            <div className="breakdown-item">
              <span>Temperature adjustment</span>
              <strong>?{breakdown.temperature_adjustment}</strong>
            </div>
            <div className="breakdown-item">
              <span>Model adjustment</span>
              <strong>?{breakdown.model_adjustment}</strong>
            </div>
            <div className="breakdown-item total">
              <span>Total weekly premium</span>
              <strong>?{breakdown.total}</strong>
            </div>
          </div>
        )}
      </InfoCard>
    </div>
  );
}
