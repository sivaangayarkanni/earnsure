import { useEffect, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { TableCard } from "../components/Cards.jsx";
import { getAdminPools } from "../api/client.js";

export default function AdminPools() {
  const [pools, setPools] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminPools()
      .then((data) => setPools(data.pools || []))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page">
      <TopBar
        title="Risk pool balance"
        subtitle="Monitor city-level pool reserves and balances."
        badge="Admin"
      />
      {error && <div className="error">{error}</div>}
      <TableCard
        title="Pool balances"
        columns={["Pool", "City", "Balance", "Reserve"]}
        rows={pools.map((pool) => ({
          id: pool.pool_id,
          values: [
            pool.pool_id,
            pool.city,
            `?${pool.total_balance}`,
            `?${pool.reserve_fund}`,
          ],
        }))}
      />
    </div>
  );
}
