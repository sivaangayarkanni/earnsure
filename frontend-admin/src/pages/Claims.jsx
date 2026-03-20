import TopBar from "../components/TopBar.jsx";
import TableCard from "../components/TableCard.jsx";
import { claims } from "../data/adminMock.js";

export default function Claims() {
  return (
    <div className="page">
      <TopBar
        title="Claims management"
        subtitle="Review, approve, or deny claims in one place."
      />
      <TableCard
        title="Claims queue"
        columns={["Claim", "Worker", "Event", "Status", "Amount"]}
        rows={claims.map((claim) => ({
          id: claim.id,
          values: [claim.id, claim.worker, claim.event, claim.status, claim.amount],
        }))}
      />
    </div>
  );
}
