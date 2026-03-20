export const workerProfile = {
  name: "Aarav Menon",
  city: "Bengaluru",
  platform: "SwiftRide",
  phone: "+91 98765 43210",
  riskScore: 0.42,
  weeklyPremium: 185,
};

export const policy = {
  policyNumber: "ES-IND-2026-01422",
  plan: "Monsoon Shield",
  status: "Active",
  coverage: "Lost income up to ?3,500/week during severe weather",
  nextRenewal: "2026-04-05",
  payoutCap: "?14,000 per month",
};

export const payoutNotifications = [
  {
    id: "p1",
    title: "Payout processed",
    description: "?2,150 sent for 2-day rain disruption.",
    time: "2 hours ago",
  },
  {
    id: "p2",
    title: "Payout approved",
    description: "?1,200 approved for AQI spike.",
    time: "Yesterday",
  },
];

export const claims = [
  {
    id: "CLM-1029",
    event: "Weather disruption",
    date: "2026-03-14",
    status: "Approved",
    payout: "?2,150",
  },
  {
    id: "CLM-1021",
    event: "AQI spike",
    date: "2026-03-10",
    status: "Paid",
    payout: "?1,200",
  },
  {
    id: "CLM-1004",
    event: "Heatwave",
    date: "2026-02-26",
    status: "Rejected",
    payout: "?0",
  },
];

export const riskAlerts = [
  {
    id: "RA-01",
    title: "Heavy rain expected",
    detail: "78% probability of >20mm rainfall tonight.",
    severity: "High",
  },
  {
    id: "RA-02",
    title: "AQI warning",
    detail: "AQI projected to exceed 200 in Central Bengaluru.",
    severity: "Medium",
  },
];

export const zones = [
  {
    id: "ZN-01",
    zone: "Koramangala",
    expectedOrderDensity: 0.82,
    note: "High dinner demand, low rain exposure.",
  },
  {
    id: "ZN-02",
    zone: "Indiranagar",
    expectedOrderDensity: 0.76,
    note: "Premium orders, moderate traffic.",
  },
  {
    id: "ZN-03",
    zone: "HSR Layout",
    expectedOrderDensity: 0.69,
    note: "Steady midday demand.",
  },
];
