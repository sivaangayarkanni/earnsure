import pg from "pg";

const { Pool } = pg;

// Mock query function when DATABASE_URL is not set
let pool = null;
let useMock = false;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
  });
  pool.on("error", (err) => {
    process.stderr.write(`Postgres pool error: ${err.message}\n`);
  });
} else {
  console.log("[MCP] No DATABASE_URL - using mock data mode");
  useMock = true;
}

// In-memory mock data store
const mockDb = {
  workers: [
    { id: "w1", name: "Arjun Mehta", phone: "+919876543210", city: "Bengaluru", platform: "Swiggy", risk_score: 0.42 },
    { id: "w2", name: "Diya Kapoor", phone: "+919876543211", city: "Hyderabad", platform: "Zomato", risk_score: 0.28 },
    { id: "w3", name: "Rahul Iyer", phone: "+919876543212", city: "Chennai", platform: "Swiggy", risk_score: 0.71 },
  ],
  policies: [
    { policy_id: "p1", worker_id: "w1", plan_type: "basic", weekly_premium: 35, status: "active" },
    { policy_id: "p2", worker_id: "w2", plan_type: "standard", weekly_premium: 25, status: "active" },
    { policy_id: "p3", worker_id: "w3", plan_type: "premium", weekly_premium: 50, status: "active" },
  ],
  claims: [],
  pools: [
    { pool_id: "pool1", city: "Bengaluru", total_balance: 1240000, reserve_fund: 240000 },
    { pool_id: "pool2", city: "Hyderabad", total_balance: 820000, reserve_fund: 160000 },
    { pool_id: "pool3", city: "Chennai", total_balance: 690000, reserve_fund: 120000 },
  ],
  zone_demand: [
    { city: "Bengaluru", zone: "Koramangala", demand_level: 0.88 },
    { city: "Bengaluru", zone: "Indiranagar", demand_level: 0.76 },
    { city: "Hyderabad", zone: "Banjara Hills", demand_level: 0.82 },
    { city: "Chennai", zone: "Anna Nagar", demand_level: 0.69 },
  ],
};

export function query(text, params) {
  if (useMock) {
    // Return mock results for common queries
    console.log("[MCP Mock] Query:", text.substring(0, 50));
    return Promise.resolve({ rows: [], rowCount: 0 });
  }
  return pool.query(text, params);
}

export async function getClient() {
  if (useMock) {
    return {
      query: () => Promise.resolve({ rows: [] }),
      release: () => {},
    };
  }
  return pool.connect();
}

export async function closePool() {
  if (pool) await pool.end();
}

export { mockDb };
