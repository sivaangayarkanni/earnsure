import TopBar from "../components/TopBar.jsx";
import TableCard from "../components/TableCard.jsx";
import { workers } from "../data/adminMock.js";

export default function Workers() {
  return (
    <div className="page">
      <TopBar
        title="Worker directory"
        subtitle="Search and monitor active gig workers."
      />
      <TableCard
        title="Active workers"
        columns={["Worker", "City", "Platform", "Risk"]}
        rows={workers.map((worker) => ({
          id: worker.id,
          values: [worker.name, worker.city, worker.platform, worker.risk],
        }))}
      />
    </div>
  );
}
