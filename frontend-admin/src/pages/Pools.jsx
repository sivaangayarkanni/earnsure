import TopBar from "../components/TopBar.jsx";
import TableCard from "../components/TableCard.jsx";
import { poolBalances } from "../data/adminMock.js";

export default function Pools() {
  return (
    <div className="page">
      <TopBar
        title="Risk pool balance"
        subtitle="Monitor city-level pool reserves and balances."
      />
      <TableCard
        title="Pool balances"
        columns={["Pool", "City", "Balance", "Reserve"]}
        rows={poolBalances.map((pool) => ({
          id: pool.id,
          values: [pool.id, pool.city, pool.balance, pool.reserve],
        }))}
      />
    </div>
  );
}
