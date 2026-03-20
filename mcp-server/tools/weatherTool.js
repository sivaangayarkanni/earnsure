export const definition = {
  name: "weather_tool",
  description: "Fetch current weather conditions for a city via OpenWeather.",
  inputSchema: {
    type: "object",
    properties: {
      city: { type: "string" },
    },
    required: ["city"],
  },
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

function normalizeCity(city) {
  return city.trim().toLowerCase();
}

export async function handler({ city }) {
  if (!city) {
    throw new Error("city is required.");
  }

  const cacheKey = normalizeCity(city);
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENWEATHER_API_KEY is not set.");
  }

  const baseUrl =
    process.env.OPENWEATHER_BASE_URL ||
    "https://api.openweathermap.org/data/2.5/weather";

  const url = new URL(baseUrl);
  url.searchParams.set("q", city);
  url.searchParams.set("appid", apiKey);
  url.searchParams.set("units", "metric");

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenWeather request failed: ${text}`);
  }

  const payload = await response.json();
  const rainfall =
    Number(payload?.rain?.["1h"] ?? payload?.rain?.["3h"] ?? 0) || 0;
  const temperature = Number(payload?.main?.temp ?? 0) || 0;
  const condition = payload?.weather?.[0]?.description || "unknown";
  const timestamp = new Date((payload?.dt ?? Date.now() / 1000) * 1000).toISOString();

  const data = {
    rainfall_mm: rainfall,
    temperature,
    weather_condition: condition,
    timestamp,
  };

  cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}
