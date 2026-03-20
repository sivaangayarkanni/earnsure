import TopBar from "../components/TopBar.jsx";
import InfoCard from "../components/InfoCard.jsx";
import { claims } from "../data/mock.js";

export default function ClaimsHistory() {
  return (
    <div className="page">
      <TopBar
        title="Claims history"
        subtitle="Track every claim and payout status."
      />
      <InfoCard title="Recent claims">
        <div className="table">
          {claims.map((claim) => (
            <div key={claim.id} className="table-row">
              <strong>{claim.id}</strong>
              <span>{claim.event}</span>
              <span>{claim.date}</span>
              <span>{claim.status}</span>
              <span>{claim.payout}</span>
            </div>
          ))}
        </div>
      </InfoCard>
    </div>
  );
}
