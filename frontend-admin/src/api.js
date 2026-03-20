const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export async function listPolicies() {
  const res = await fetch(`${API_BASE}/policies`);
  if (!res.ok) throw new Error("Failed to load policies");
  return res.json();
}

export async function listPayouts(policyId) {
  const res = await fetch(`${API_BASE}/payouts?policyId=${policyId}`);
  if (!res.ok) throw new Error("Failed to load payouts");
  return res.json();
}
