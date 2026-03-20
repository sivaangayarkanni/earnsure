require("dotenv").config({ path: "../backend/.env" });
const { Sequelize, DataTypes } = require("sequelize");

const DATABASE_URL = process.env.DATABASE_URL || "postgres://earnsure:earnsure_dev_password@localhost:5432/earnsure";

const sequelize = new Sequelize(DATABASE_URL, { dialect: "postgres", logging: false });

async function seed() {
  const client = await sequelize.connectionManager.getConnection({ type: "read" });

  const q = (sql, params = []) => sequelize.query(sql, { bind: params, type: Sequelize.QueryTypes.RAW });

  console.log("🌱 Seeding EarnSure database...");

  // Workers
  const workers = [
    { name: "Arjun Mehta", phone: "+919876543210", city: "Bengaluru", platform: "Swiggy", risk_score: 0.42 },
    { name: "Diya Kapoor", phone: "+919876543211", city: "Hyderabad", platform: "Zomato", risk_score: 0.28 },
    { name: "Rahul Iyer", phone: "+919876543212", city: "Chennai", platform: "Swiggy", risk_score: 0.71 },
    { name: "Meera Nair", phone: "+919876543213", city: "Bengaluru", platform: "Blinkit", risk_score: 0.22 },
    { name: "Karan Singh", phone: "+919876543214", city: "Pune", platform: "Zepto", risk_score: 0.55 },
    { name: "Priya Sharma", phone: "+919876543215", city: "Hyderabad", platform: "Zomato", risk_score: 0.31 },
  ];

  const workerIds = [];
  for (const w of workers) {
    const [rows] = await sequelize.query(
      `INSERT INTO workers (name, phone, city, platform, risk_score)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      { bind: [w.name, w.phone, w.city, w.platform, w.risk_score], type: Sequelize.QueryTypes.SELECT }
    );
    workerIds.push(rows.id);
    console.log(`  ✓ Worker: ${w.name} (${w.platform}, ${w.city})`);
  }

  // Policies
  const plans = ["basic", "standard", "premium", "basic", "standard", "basic"];
  const premiums = [35, 25, 50, 25, 35, 25];
  const policyIds = [];
  for (let i = 0; i < workerIds.length; i++) {
    const [rows] = await sequelize.query(
      `INSERT INTO policies (worker_id, plan_type, weekly_premium, coverage_details, status, start_date)
       VALUES ($1, $2, $3, $4, 'active', CURRENT_DATE - INTERVAL '30 days')
       RETURNING policy_id`,
      {
        bind: [workerIds[i], plans[i], premiums[i], JSON.stringify({ trigger: "parametric", payout_cap: 14000 })],
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    policyIds.push(rows.policy_id);
    console.log(`  ✓ Policy: ${plans[i]} @ ₹${premiums[i]}/wk for worker ${i + 1}`);
  }

  // Claims
  const claimData = [
    { idx: 0, event: "heavy_rain", status: "paid", payout: 2150, days: 5 },
    { idx: 0, event: "aqi_spike", status: "paid", payout: 1200, days: 9 },
    { idx: 0, event: "algorithm_downtime", status: "submitted", payout: 900, days: 13 },
    { idx: 1, event: "heavy_rain", status: "approved", payout: 1800, days: 7 },
    { idx: 2, event: "heatwave", status: "rejected", payout: 0, days: 20 },
    { idx: 3, event: "heavy_rain", status: "paid", payout: 1800, days: 3 },
    { idx: 4, event: "algorithm_downtime", status: "paid", payout: 900, days: 8 },
  ];

  for (const c of claimData) {
    await sequelize.query(
      `INSERT INTO claims (policy_id, event_type, lost_income, claim_status, payout_amount, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${c.days} days')`,
      { bind: [policyIds[c.idx], c.event, c.payout, c.status, c.payout], type: Sequelize.QueryTypes.RAW }
    );
    console.log(`  ✓ Claim: ${c.event} → ${c.status} (₹${c.payout})`);
  }

  // Risk events
  const riskEvents = [
    { location: "Bengaluru", event_type: "heavy_rain", severity: 0.8 },
    { location: "Hyderabad", event_type: "aqi_spike", severity: 0.6 },
    { location: "Chennai", event_type: "heatwave", severity: 0.9 },
    { location: "Bengaluru", event_type: "algorithm_downtime", severity: 0.5 },
  ];
  for (const e of riskEvents) {
    await sequelize.query(
      `INSERT INTO risk_events (location, event_type, severity) VALUES ($1, $2, $3)`,
      { bind: [e.location, e.event_type, e.severity], type: Sequelize.QueryTypes.RAW }
    );
  }
  console.log("  ✓ Risk events seeded");

  // Pools
  const poolData = [
    { city: "Bengaluru", balance: 1240000, reserve: 240000 },
    { city: "Hyderabad", balance: 820000, reserve: 160000 },
    { city: "Chennai", balance: 690000, reserve: 120000 },
    { city: "Pune", balance: 410000, reserve: 80000 },
  ];
  for (const p of poolData) {
    await sequelize.query(
      `INSERT INTO pools (city, total_balance, reserve_fund)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      { bind: [p.city, p.balance, p.reserve], type: Sequelize.QueryTypes.RAW }
    );
    console.log(`  ✓ Pool: ${p.city} ₹${(p.balance / 100000).toFixed(1)}L`);
  }

  // Zone demand
  const zones = [
    { city: "Bengaluru", zone: "Koramangala", demand: 0.88 },
    { city: "Bengaluru", zone: "Indiranagar", demand: 0.76 },
    { city: "Bengaluru", zone: "HSR Layout", demand: 0.71 },
    { city: "Bengaluru", zone: "Whitefield", demand: 0.65 },
    { city: "Hyderabad", zone: "Banjara Hills", demand: 0.82 },
    { city: "Hyderabad", zone: "Hitech City", demand: 0.74 },
    { city: "Chennai", zone: "Anna Nagar", demand: 0.69 },
    { city: "Pune", zone: "Koregaon Park", demand: 0.77 },
  ];
  for (const z of zones) {
    await sequelize.query(
      `INSERT INTO zone_demand (city, zone, demand_level) VALUES ($1, $2, $3)`,
      { bind: [z.city, z.zone, z.demand], type: Sequelize.QueryTypes.RAW }
    );
  }
  console.log("  ✓ Zone demand seeded");

  console.log("\n✅ Seed complete! EarnSure DB is ready.");
  await sequelize.close();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
