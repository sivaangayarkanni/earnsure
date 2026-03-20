import TopBar from "../components/TopBar.jsx";
import InfoCard from "../components/InfoCard.jsx";
import { zones } from "../data/mock.js";

export default function ZoneSuggestions() {
  return (
    <div className="page">
      <TopBar
        title="Zone suggestions"
        subtitle="Target high-demand zones to maximize earnings."
      />
      <InfoCard title="Recommended zones">
        <div className="zone-grid">
          {zones.map((zone) => (
            <div key={zone.id} className="zone-card">
              <h4>{zone.zone}</h4>
              <p>{zone.note}</p>
              <strong>{Math.round(zone.expectedOrderDensity * 100)}% demand</strong>
            </div>
          ))}
        </div>
      </InfoCard>
    </div>
  );
}
