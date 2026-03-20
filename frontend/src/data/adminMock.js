export const kpis = {
  premiumRevenue: 1285000,
  claimsPaid: 392000,
  poolHealth: 0.76,
  workersActive: 4820,
  fraudFlagged: 12,
  avgRiskScore: 0.48,
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
  { id: "W-102", name: "Arjun Mehta", city: "Bengaluru", platform: "Swiggy", workType: "Full-time", risk: "Medium", premium: "₹35/wk", status: "Active" },
  { id: "W-221", name: "Diya Kapoor", city: "Hyderabad", platform: "Zomato", workType: "Part-time", risk: "Low", premium: "₹25/wk", status: "Active" },
  { id: "W-317", name: "Rahul Iyer", city: "Chennai", platform: "Swiggy", workType: "Full-time", risk: "High", premium: "₹50/wk", status: "Active" },
  { id: "W-402", name: "Meera Nair", city: "Bengaluru", platform: "Blinkit", workType: "Part-time", risk: "Low", premium: "₹25/wk", status: "Active" },
  { id: "W-518", name: "Karan Singh", city: "Pune", platform: "Zepto", workType: "Full-time", risk: "Medium", premium: "₹35/wk", status: "Active" },
  { id: "W-634", name: "Priya Sharma", city: "Hyderabad", platform: "Zomato", workType: "Part-time", risk: "Low", premium: "₹25/wk", status: "Active" },
];

export const disruptions = [
  { id: "D-091", type: "Heavy rain", city: "Bengaluru", severity: "High", time: "15 min ago", triggered: "Yes", workers: 312 },
  { id: "D-088", type: "AQI spike", city: "Hyderabad", severity: "Medium", time: "1 hour ago", triggered: "Yes", workers: 187 },
  { id: "D-086", type: "Heatwave", city: "Chennai", severity: "High", time: "Today 2 PM", triggered: "Pending", workers: 224 },
  { id: "D-081", type: "Algorithm downtime", city: "Bengaluru", severity: "Medium", time: "Yesterday", triggered: "Yes", workers: 98 },
  { id: "D-079", type: "Traffic surge", city: "Pune", severity: "Low", time: "2 days ago", triggered: "No", workers: 45 },
];

export const claims = [
  { id: "CL-889", worker: "Arjun Mehta", platform: "Swiggy", event: "Heavy rain", status: "Under review", amount: "₹2,150", date: "2026-03-14" },
  { id: "CL-880", worker: "Diya Kapoor", platform: "Zomato", event: "AQI spike", status: "Approved", amount: "₹1,200", date: "2026-03-10" },
  { id: "CL-872", worker: "Rahul Iyer", platform: "Swiggy", event: "Heatwave", status: "Rejected", amount: "₹0", date: "2026-02-26" },
  { id: "CL-865", worker: "Karan Singh", platform: "Zepto", event: "Algorithm downtime", status: "Paid", amount: "₹900", date: "2026-03-12" },
  { id: "CL-858", worker: "Meera Nair", platform: "Blinkit", event: "Heavy rain", status: "Approved", amount: "₹1,800", date: "2026-03-08" },
];

export const fraudAlerts = [
  { id: "F-102", worker: "Rahul Iyer", platform: "Swiggy", flag: "Duplicate claims", score: 0.82, city: "Chennai", action: "Hold" },
  { id: "F-097", worker: "Diya Kapoor", platform: "Zomato", flag: "Abnormal frequency", score: 0.63, city: "Hyderabad", action: "Review" },
  { id: "F-091", worker: "Unknown W-719", platform: "Blinkit", flag: "GPS mismatch", score: 0.74, city: "Bengaluru", action: "Hold" },
];

export const poolBalances = [
  { id: "P-01", city: "Bengaluru", balance: "₹12.4L", reserve: "₹2.4L", members: 2180, health: "Good" },
  { id: "P-02", city: "Hyderabad", balance: "₹8.2L", reserve: "₹1.6L", members: 1160, health: "Good" },
  { id: "P-03", city: "Chennai", balance: "₹6.9L", reserve: "₹1.2L", members: 870, health: "Watch" },
  { id: "P-04", city: "Pune", balance: "₹4.1L", reserve: "₹0.8L", members: 610, health: "Good" },
];
