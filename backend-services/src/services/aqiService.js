import { logger } from "../lib/logger.js";

const apiKey = () => process.env.OPENWEATHER_API_KEY;
const geoUrl = () => process.env.OPENWEATHER_GEO_URL || "http://api.openweathermap.org/geo/1.0/direct";
const airUrl = () => process.env.OPENWEATHER_AIR_URL || "http://api.openweathermap.org/data/2.5/air_pollution";

export async function getCityCoordinates(city) {
  const url = new URL(geoUrl());
  url.searchParams.set("q", city);
  url.searchParams.set("limit", "1");
  url.searchParams.set("appid", apiKey());

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenWeather geo failed: ${text}`);
  }
  const data = await response.json();
  if (!data?.[0]) {
    throw new Error("City not found for AQI lookup.");
  }
  return { lat: data[0].lat, lon: data[0].lon };
}

export async function getAqiForCity(city) {
  if (!apiKey()) {
    throw new Error("OPENWEATHER_API_KEY is not set.");
  }
  const { lat, lon } = await getCityCoordinates(city);
  const url = new URL(airUrl());
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("appid", apiKey());

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenWeather air pollution failed: ${text}`);
  }
  const data = await response.json();
  const aqi = data?.list?.[0]?.main?.aqi ?? 0;
  logger.debug({ city, aqi }, "AQI fetched");
  return aqi;
}
