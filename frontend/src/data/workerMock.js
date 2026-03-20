export const workerProfile = {
  name: "Arjun Mehta",
  city: "Bengaluru",
  platform: "Swiggy",
  workType: "Full-time",
  phone: "+91 98765 43210",
  joinedDate: "Jan 2024",
  avgDailyHours: 9,
  acceptanceRate: "87%",
  totalDeliveries: 3842,
  riskScore: 0.42,
  riskLevel: "Medium",
  weeklyPremium: 35,
  workerScore: 84,
  coverageStatus: "Active",
};

export const policy = {
  policyNumber: "ES-BLR-2026-01422",
  plan: "Monsoon Shield",
  status: "Active",
  coverage: "Lost income up to ₹3,500/week during severe weather, AQI spikes & algorithm downtime",
  nextRenewal: "2026-04-07",
  payoutCap: "₹14,000/month",
  triggerConditions: [
    "Rainfall > 20mm in 3 hours",
    "AQI > 200 for 4+ hours",
    "Platform demand drop > 60% for 2+ hours",
    "Temperature > 42°C",
  ],
};

export const payoutNotifications = [
  {
    id: "p1",
    title: "Payout processed",
    description: "₹2,150 sent for 2-day heavy rain disruption in Bengaluru.",
    time: "2 hours ago",
    type: "success",
  },
  {
    id: "p2",
    title: "Payout approved",
    description: "₹1,200 approved for AQI spike — Central Bengaluru.",
    time: "Yesterday",
    type: "success",
  },
  {
    id: "p3",
    title: "Claim under review",
    description: "₹900 claim for algorithm downtime is being verified.",
    time: "2 days ago",
    type: "pending",
  },
];

export const claims = [
  {
    id: "CLM-1029",
    event: "Heavy rain",
    date: "2026-03-14",
    status: "Paid",
    payout: "₹2,150",
    trigger: "Parametric",
  },
  {
    id: "CLM-1021",
    event: "AQI spike",
    date: "2026-03-10",
    status: "Paid",
    payout: "₹1,200",
    trigger: "Parametric",
  },
  {
    id: "CLM-1015",
    event: "Algorithm downtime",
    date: "2026-03-06",
    status: "Under review",
    payout: "₹900",
    trigger: "AI detected",
  },
  {
    id: "CLM-1004",
    event: "Heatwave",
    date: "2026-02-26",
    status: "Rejected",
    payout: "₹0",
    trigger: "Manual",
  },
];

export const riskAlerts = [
  {
    id: "RA-01",
    title: "Heavy rain expected tonight",
    detail: "78% probability of >20mm rainfall. Parametric trigger may activate.",
    severity: "High",
    time: "Active now",
    icon: "🌧️",
  },
  {
    id: "RA-02",
    title: "AQI warning — Central Bengaluru",
    detail: "AQI projected to exceed 200. Avoid Silk Board & MG Road zones.",
    severity: "Medium",
    time: "Next 4 hours",
    icon: "🌫️",
  },
  {
    id: "RA-03",
    title: "Swiggy demand anomaly detected",
    detail: "Order volume dropped 65% in Koramangala. AI monitoring for payout trigger.",
    severity: "Medium",
    time: "30 min ago",
    icon: "📉",
  },
];

export const zones = [
  {
    id: "ZN-01",
    zone: "Koramangala",
    expectedOrderDensity: 0.88,
    note: "Peak dinner demand. Low rain exposure. High Swiggy surge.",
    platform: "Swiggy",
    earnings: "₹180–220/hr",
  },
  {
    id: "ZN-02",
    zone: "Indiranagar",
    expectedOrderDensity: 0.76,
    note: "Premium restaurant orders. Moderate traffic. Good for Zomato.",
    platform: "Zomato",
    earnings: "₹160–200/hr",
  },
  {
    id: "ZN-03",
    zone: "HSR Layout",
    expectedOrderDensity: 0.71,
    note: "Steady Blinkit grocery demand. Low disruption risk.",
    platform: "Blinkit",
    earnings: "₹140–170/hr",
  },
  {
    id: "ZN-04",
    zone: "Whitefield",
    expectedOrderDensity: 0.65,
    note: "IT corridor lunch rush. Best 12–2pm window.",
    platform: "Swiggy",
    earnings: "₹130–160/hr",
  },
];

export const incomeInsights = {
  thisWeek: 4820,
  lastWeek: 5100,
  projectedRisk: "Medium",
  bestDay: "Saturday",
  bestTime: "7–9 PM",
  tip: "Rain expected tonight — consider wrapping up by 7 PM or claim will auto-trigger.",
};
