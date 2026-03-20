export const kpis = {
  premiumRevenue: 1285000,
  claimsPaid: 392000,
  poolHealth: 0.76,
  workersActive: 4820,
};

export const premiumSeries = [
  { label: "W1", value: 180000 },
  { label: "W2", value: 230000 },
  { label: "W3", value: 210000 },
  { label: "W4", value: 260000 },
  { label: "W5", value: 250000 },
];

export const claimsSeries = [
  { label: "W1", value: 48000 },
  { label: "W2", value: 76000 },
  { label: "W3", value: 69000 },
  { label: "W4", value: 82000 },
  { label: "W5", value: 97000 },
];

export const poolHealthSeries = [
  { label: "Central", value: 0.82 },
  { label: "North", value: 0.71 },
  { label: "East", value: 0.64 },
  { label: "South", value: 0.79 },
];

export const workerDistribution = [
  { label: "Bengaluru", value: 0.45 },
  { label: "Hyderabad", value: 0.24 },
  { label: "Chennai", value: 0.18 },
  { label: "Pune", value: 0.13 },
];

export const workers = [
  { id: "W-102", name: "Aarav Menon", city: "Bengaluru", platform: "SwiftRide", risk: "Low" },
  { id: "W-221", name: "Diya Kapoor", city: "Hyderabad", platform: "QuickDrop", risk: "Medium" },
  { id: "W-317", name: "Rahul Iyer", city: "Chennai", platform: "SwiftRide", risk: "High" },
  { id: "W-402", name: "Meera Nair", city: "Bengaluru", platform: "Zippy", risk: "Low" },
];

export const disruptions = [
  { id: "D-091", type: "Heavy rain", city: "Bengaluru", severity: "High", time: "15 min ago" },
  { id: "D-088", type: "AQI spike", city: "Hyderabad", severity: "Medium", time: "1 hour ago" },
  { id: "D-086", type: "Heatwave", city: "Chennai", severity: "High", time: "Today" },
];

export const claims = [
  { id: "CL-889", worker: "Aarav Menon", event: "Weather", status: "Review", amount: "?2,150" },
  { id: "CL-880", worker: "Diya Kapoor", event: "AQI", status: "Approved", amount: "?1,200" },
  { id: "CL-872", worker: "Rahul Iyer", event: "Heatwave", status: "Rejected", amount: "?0" },
];

export const fraudAlerts = [
  { id: "F-102", worker: "Rahul Iyer", flag: "Duplicate claims", score: 0.82 },
  { id: "F-097", worker: "Diya Kapoor", flag: "Abnormal frequency", score: 0.63 },
];

export const poolBalances = [
  { id: "P-01", city: "Bengaluru", balance: "?1.2M", reserve: "?240K" },
  { id: "P-02", city: "Hyderabad", balance: "?820K", reserve: "?160K" },
  { id: "P-03", city: "Chennai", balance: "?690K", reserve: "?120K" },
];
