import TopBar from "../components/TopBar.jsx";
import TableCard from "../components/TableCard.jsx";
import { disruptions } from "../data/adminMock.js";

export default function Disruptions() {
  return (
    <div className="page">
      <TopBar
        title="Disruption monitor"
        subtitle="Track weather, AQI, and safety signals."
      />
      <TableCard
        title="Live disruptions"
        columns={["Type", "City", "Severity", "Time"]}
        rows={disruptions.map((event) => ({
          id: event.id,
          values: [event.type, event.city, event.severity, event.time],
        }))}
      />
    </div>
  );
}
