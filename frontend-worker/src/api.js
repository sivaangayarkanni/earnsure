const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export async function fetchPolicy(policyId) {
  const res = await fetch(`${API_BASE}/policies/${policyId}`);
  if (!res.ok) throw new Error("Policy not found");
  return res.json();
}

export async function evaluateTrigger(payload) {
  const res = await fetch(`${API_BASE}/triggers/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Trigger evaluation failed");
  return res.json();
}
