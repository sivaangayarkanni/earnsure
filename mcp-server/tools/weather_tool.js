import { query } from "../db/connection.js";

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

function normalizeCity(city) {
  return city.trim().toLowerCase();
}

// Mock weather data for demo mode (no API key needed)
function getMockWeatherData(city) {
  const cities = {
    mumbai: { rainfall_mm: 0, temperature: 32, weather_condition: "partly cloudy" },
    chennai: { rainfall_mm: 25, temperature: 29, weather_condition: "heavy rain" },
    delhi: { rainfall_mm: 0, temperature: 38, weather_condition: "clear sky" },
    bangalore: { rainfall_mm: 5, temperature: 24, weather_condition: "light rain" },
    kolkata: { rainfall_mm: 15, temperature: 31, weather_condition: "moderate rain" },
    hyderabad: { rainfall_mm: 0, temperature: 35, weather_condition: "sunny" },
  };
  const normalized = normalizeCity(city);
  return cities[normalized] || { rainfall_mm: Math.random() * 10, temperature: 25 + Math.random() * 15, weather_condition: "clear" };
}

export const definition = {
  name: "weather_tool",
  description: "Fetch weather disruptions for a city using OpenWeather.",
  inputSchema: {
    type: "object",
    properties: {
      city: { type: "string" },
    },
    required: ["city"],
  },
};

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
  let data;

  if (!apiKey) {
    // Demo mode - use mock data
    console.log("[Weather Tool] No API key - using demo/mock data");
    data = getMockWeatherData(city);
    data.timestamp = new Date().toISOString();
  } else {
    // Production mode - use real API
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
    data = {
      rainfall_mm: Number(payload?.rain?.["1h"] ?? payload?.rain?.["3h"] ?? 0) || 0,
      temperature: Number(payload?.main?.temp ?? 0) || 0,
      weather_condition: payload?.weather?.[0]?.description || "unknown",
      timestamp: new Date((payload?.dt ?? Date.now() / 1000) * 1000).toISOString(),
    };
  }

  try {
    await query(
      `INSERT INTO risk_events (location, event_type, severity, timestamp)
       VALUES ($1, 'weather', $2, $3)`,
      [city, data.rainfall_mm, data.timestamp]
    );
  } catch (e) {
    console.log("[Weather Tool] DB insert failed (expected if no DB):", e.message);
  }

  cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}
