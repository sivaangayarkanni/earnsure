const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const ACCESS_KEY = "earnsure_access_token";
const REFRESH_KEY = "earnsure_refresh_token";

export function setTokens({ access_token, refresh_token }) {
  if (access_token) localStorage.setItem(ACCESS_KEY, access_token);
  if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

async function api(path, options = {}, retry = true) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401 && retry && getRefreshToken()) {
    const refreshed = await refreshToken();
    if (refreshed) {
      return api(path, options, false);
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `API error ${res.status}`);
  }
  return res.json();
}

const post = (path, body) => api(path, { method: "POST", body: JSON.stringify(body) });

export async function requestOtp(payload) {
  return post("/auth/request-otp", payload);
}

export async function verifyOtp(payload) {
  return post("/auth/verify-otp", payload);
}

export async function refreshToken() {
  const refresh_token = getRefreshToken();
  if (!refresh_token) return null;
  try {
    const data = await post("/auth/refresh", { refresh_token });
    setTokens({ access_token: data.access_token });
    return data.access_token;
  } catch (err) {
    clearTokens();
    return null;
  }
}

export async function logout() {
  const refresh_token = getRefreshToken();
  if (refresh_token) {
    await post("/auth/logout", { refresh_token });
  }
  clearTokens();
}

export const getWorkerProfile = () => api("/worker/profile");
export const getWorkerPolicy = () => api("/worker/policy");
export const getWorkerClaims = () => api("/worker/claims");
export const getWorkerAlerts = () => api("/worker/alerts");
export const getWorkerZones = () => api("/worker/zones");
export const getWorkerStability = () => api("/worker/stability");
export const getWorkerPremiumBreakdown = () => api("/worker/premium-breakdown");
export const getWorkerNotifications = () => api("/worker/notifications");

export const getAdminOverview = () => api("/admin/overview");
export const getAdminWorkers = () => api("/admin/workers");
export const getAdminDisruptions = () => api("/admin/disruptions");
export const getAdminClaims = () => api("/admin/claims");
export const getAdminFraud = () => api("/admin/fraud");
export const getAdminPools = () => api("/admin/pools");
export const getAdminDowntime = () => api("/admin/downtime");
export const getAdminHeatmap = () => api("/admin/heatmap");
export const getAdminAlerts = () => api("/admin/alerts");
export const updateWorkerProfile = (body) => api("/worker/profile", { method: "PATCH", body: JSON.stringify(body) });
