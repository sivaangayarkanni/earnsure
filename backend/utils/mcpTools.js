/**
 * In-process MCP Tools for EarnSure
 * These work without external MCP server
 */

// In-memory data store (demo mode)
const mockDb = {
  workers: new Map(),
  policies: new Map(),
  claims: new Map(),
  pools: new Map(),
  zoneDemand: new Map(),
  transactions: [],
};

// Initialize with seed data
function initMockData() {
  // Workers
  const workers = [
    { id: "w1", name: "Arjun Mehta", phone: "+919876543210", city: "Bengaluru", platform: "Swiggy", risk_score: 0.42 },
    { id: "w2", name: "Diya Kapoor", phone: "+919876543211", city: "Hyderabad", platform: "Zomato", risk_score: 0.28 },
    { id: "w3", name: "Rahul Iyer", phone: "+919876543212", city: "Chennai", platform: "Swiggy", risk_score: 0.71 },
    { id: "w4", name: "Meera Nair", phone: "+919876543213", city: "Bengaluru", platform: "Blinkit", risk_score: 0.22 },
    { id: "w5", name: "Karan Singh", phone: "+919876543214", city: "Pune", platform: "Zepto", risk_score: 0.55 },
  ];
  workers.forEach(w => mockDb.workers.set(w.id, w));
  workers.forEach(w => mockDb.workers.set(w.phone, w));

  // Policies
  const policies = [
    { policy_id: "p1", worker_id: "w1", plan_type: "basic", weekly_premium: 35, status: "active", coverage_details: { trigger: "parametric" } },
    { policy_id: "p2", worker_id: "w2", plan_type: "standard", weekly_premium: 25, status: "active", coverage_details: { trigger: "parametric" } },
    { policy_id: "p3", worker_id: "w3", plan_type: "premium", weekly_premium: 50, status: "active", coverage_details: { trigger: "parametric" } },
    { policy_id: "p4", worker_id: "w4", plan_type: "basic", weekly_premium: 25, status: "active", coverage_details: { trigger: "parametric" } },
    { policy_id: "p5", worker_id: "w5", plan_type: "standard", weekly_premium: 35, status: "active", coverage_details: { trigger: "parametric" } },
  ];
  policies.forEach(p => mockDb.policies.set(p.policy_id, p));

  // Pools
  const pools = [
    { pool_id: "pool1", city: "Bengaluru", total_balance: 1240000, reserve_fund: 240000 },
    { pool_id: "pool2", city: "Hyderabad", total_balance: 820000, reserve_fund: 160000 },
    { pool_id: "pool3", city: "Chennai", total_balance: 690000, reserve_fund: 120000 },
    { pool_id: "pool4", city: "Pune", total_balance: 410000, reserve_fund: 80000 },
  ];
  pools.forEach(p => mockDb.pools.set(p.pool_id, p));
  pools.forEach(p => mockDb.pools.set(p.city, p));

  // Zone demand
  const zones = [
    { city: "Bengaluru", zone: "Koramangala", demand_level: 0.88 },
    { city: "Bengaluru", zone: "Indiranagar", demand_level: 0.76 },
    { city: "Bengaluru", zone: "HSR Layout", demand_level: 0.71 },
    { city: "Hyderabad", zone: "Banjara Hills", demand_level: 0.82 },
    { city: "Hyderabad", zone: "Hitech City", demand_level: 0.74 },
    { city: "Chennai", zone: "Anna Nagar", demand_level: 0.69 },
    { city: "Pune", zone: "Koregaon Park", demand_level: 0.77 },
  ];
  zones.forEach(z => mockDb.zoneDemand.set(`${z.city}-${z.zone}`, z));

  console.log("[MCP] Mock data initialized");
}

// Initialize on load
initMockData();

// Weather tool - mock data for demo
const weatherData = {
  mumbai: { rainfall_mm: 0, temperature: 32, weather_condition: "clear sky" },
  chennai: { rainfall_mm: 25, temperature: 29, weather_condition: "heavy rain" },
  delhi: { rainfall_mm: 0, temperature: 38, weather_condition: "clear sky" },
  bengaluru: { rainfall_mm: 5, temperature: 24, weather_condition: "light rain" },
  bangalore: { rainfall_mm: 5, temperature: 24, weather_condition: "light rain" },
  kolkata: { rainfall_mm: 15, temperature: 31, weather_condition: "moderate rain" },
  hyderabad: { rainfall_mm: 0, temperature: 35, weather_condition: "sunny" },
  pune: { rainfall_mm: 0, temperature: 30, weather_condition: "partly cloudy" },
};

async function weatherTool({ city }) {
  const normalized = city?.toLowerCase() || "";
  const data = weatherData[normalized] || { 
    rainfall_mm: Math.random() * 10, 
    temperature: 25 + Math.random() * 15, 
    weather_condition: "clear" 
  };
  return { ...data, timestamp: new Date().toISOString() };
}

// Risk prediction tool - fallback calculation
function calculateRisk(city, rain_probability, AQI, temperature) {
  const aqi_score = Math.min(AQI / 500, 1.0);
  let temp_score = 0;
  if (temperature > 40) temp_score = Math.min((temperature - 40) / 20, 1.0);
  else if (temperature < 10) temp_score = Math.min((10 - temperature) / 20, 1.0);

  const risk_score = Math.min((rain_probability * 0.5) + (aqi_score * 0.3) + (temp_score * 0.2), 1.0);
  
  let premium, risk_level;
  if (risk_score < 0.35) { premium = 25; risk_level = "low"; }
  else if (risk_score < 0.65) { premium = 35; risk_level = "medium"; }
  else { premium = 50; risk_level = "high"; }

  return { risk_score: Math.round(risk_score * 10000) / 10000, recommended_weekly_premium: premium, risk_level };
}

async function riskPredictionTool({ city, rain_probability, AQI, temperature }) {
  return calculateRisk(city, rain_probability, AQI, temperature);
}

// Claim tool
async function claimTool({ action, policy_id, event_type, claim_id, claim_status }) {
  if (action === "create") {
    const claim = {
      claim_id: "c" + Date.now(),
      policy_id,
      event_type,
      lost_income: 360,
      claim_status: "submitted",
      payout_amount: 360,
      created_at: new Date().toISOString(),
    };
    mockDb.claims.set(claim.claim_id, claim);
    return { claim };
  }
  if (action === "update" && claim_id && claim_status) {
    const claim = mockDb.claims.get(claim_id);
    if (claim) {
      claim.claim_status = claim_status;
      return { claim };
    }
  }
  if (action === "get" && claim_id) {
    return { claim: mockDb.claims.get(claim_id) };
  }
  return { error: "Invalid action" };
}

// Fraud detection tool
async function fraudDetectionTool({ worker_id, claim_id }) {
  // Simulate fraud check
  const score = Math.random() * 0.5;
  return { fraud_score: score, flagged: score >= 0.6 };
}

// Pool tool
async function poolTool({ action, city, pool_id, worker_id, weekly_contribution }) {
  if (action === "calculate_pool_balance") {
    const pool = mockDb.pools.get(pool_id) || mockDb.pools.get(city);
    return pool || { error: "Pool not found" };
  }
  if (action === "join_pool") {
    return { success: true, message: "Joined pool" };
  }
  if (action === "allocate_payout") {
    return { success: true, payout: 360 };
  }
  return { error: "Unknown action" };
}

// Payment tool
async function paymentTool({ worker_id, amount }) {
  return {
    payment_id: "pay_" + Date.now(),
    worker_id,
    amount,
    payment_status: "completed",
    timestamp: new Date().toISOString(),
  };
}

// Zone recommendation tool
async function zoneTool({ city, limit = 3 }) {
  const zones = [];
  for (const [key, z] of mockDb.zoneDemand) {
    if (z.city.toLowerCase() === city.toLowerCase()) {
      zones.push(z);
    }
  }
  zones.sort((a, b) => b.demand_level - a.demand_level);
  return {
    recommended_zone: zones[0]?.zone || null,
    expected_order_density: zones[0]?.demand_level || 0,
    all_zones: zones.slice(0, limit),
  };
}

// Location tool (OpenStreetMap/Nominatim - free, no API key)
async function locationTool({ action, address, city, limit = 10 }) {
  // Return mock location data for Indian cities
  const locations = {
    "mumbai": [{ display_name: "Mumbai, Maharashtra, India", lat: "19.0760", lon: "72.8777" }],
    "bengaluru": [{ display_name: "Bengaluru, Karnataka, India", lat: "12.9716", lon: "77.5946" }],
    "bangalore": [{ display_name: "Bangalore, Karnataka, India", lat: "12.9716", lon: "77.5946" }],
    "chennai": [{ display_name: "Chennai, Tamil Nadu, India", lat: "13.0827", lon: "80.2707" }],
    "hyderabad": [{ display_name: "Hyderabad, Telangana, India", lat: "17.3850", lon: "78.4867" }],
    "delhi": [{ display_name: "New Delhi, Delhi, India", lat: "28.6139", lon: "77.2090" }],
    "pune": [{ display_name: "Pune, Maharashtra, India", lat: "18.5204", lon: "73.8567" }],
  };
  
  const key = (city || address || "").toLowerCase();
  return {
    status: "OK",
    results: locations[key] || [],
  };
}

// Algorithm downtime tool
async function algorithmDowntimeTool({ worker_id, city, online_status, orders_received, expected_orders = 10 }) {
  const order_drop_percentage = expected_orders > 0 ? ((expected_orders - orders_received) / expected_orders) * 100 : 0;
  const is_downtime = online_status && order_drop_percentage > 50;
  
  return {
    worker_id,
    city,
    online_status,
    orders_received,
    expected_orders,
    order_drop_percentage,
    is_downtime,
    will_trigger_claim: is_downtime,
  };
}

// Export all tools
module.exports = {
  weatherTool,
  riskPredictionTool,
  claimTool,
  fraudDetectionTool,
  poolTool,
  paymentTool,
  zoneTool,
  locationTool,
  algorithmDowntimeTool,
  mockDb,
};
