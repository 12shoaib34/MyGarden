import { getSetting, setSetting } from "../storage/database";

const SURJANI_TOWN_COORDINATES = {
  latitude: 25.040071,
  longitude: 67.062393,
};

const WEATHER_CACHE_KEY = "surjani_town_weather_cache";
const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000;

const fallbackWeather = {
  temperature: 24,
  feelsLike: 24,
  humidity: 65,
  windSpeed: 5,
  condition: "Sunny",
  careTip: "Perfect day for repotting",
  weatherCode: 0,
  updatedAt: null,
  isFallback: true,
};

export async function getSurjaniTownWeather({ forceRefresh = false } = {}) {
  const cachedWeather = await getCachedWeather();

  if (!forceRefresh && cachedWeather && isFresh(cachedWeather.updatedAt)) {
    return cachedWeather;
  }

  try {
    const weather = await fetchSurjaniTownWeather();
    await setSetting(WEATHER_CACHE_KEY, JSON.stringify(weather));
    return weather;
  } catch {
    return cachedWeather ?? fallbackWeather;
  }
}

async function fetchSurjaniTownWeather() {
  const params = new URLSearchParams({
    latitude: String(SURJANI_TOWN_COORDINATES.latitude),
    longitude: String(SURJANI_TOWN_COORDINATES.longitude),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code",
    timezone: "Asia/Karachi",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
      { signal: controller.signal },
    );

    if (!response.ok) {
      throw new Error("Weather request failed");
    }

    const data = await response.json();
    const current = data.current ?? {};
    const weatherCode = Number(current.weather_code ?? 0);

    return {
      temperature: Math.round(Number(current.temperature_2m ?? 24)),
      feelsLike: Math.round(Number(current.apparent_temperature ?? current.temperature_2m ?? 24)),
      humidity: Math.round(Number(current.relative_humidity_2m ?? 65)),
      windSpeed: Math.round(Number(current.wind_speed_10m ?? 5)),
      condition: getWeatherCondition(weatherCode),
      careTip: getGardenCareTip(weatherCode),
      weatherCode,
      updatedAt: new Date().toISOString(),
      isFallback: false,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function getCachedWeather() {
  const rawWeather = await getSetting(WEATHER_CACHE_KEY, null);

  if (!rawWeather) {
    return null;
  }

  try {
    return JSON.parse(rawWeather);
  } catch {
    return null;
  }
}

function isFresh(updatedAt) {
  if (!updatedAt) {
    return false;
  }

  return Date.now() - new Date(updatedAt).getTime() < WEATHER_CACHE_TTL_MS;
}

function getWeatherCondition(code) {
  if (code === 0) return "Sunny";
  if ([1, 2].includes(code)) return "Partly Cloudy";
  if (code === 3) return "Cloudy";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rainy";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Cold";
  if ([95, 96, 99].includes(code)) return "Stormy";
  return "Clear";
}

function getGardenCareTip(code) {
  if (code === 0) return "Check sunlight and soil moisture";
  if ([1, 2, 3].includes(code)) return "Good day for pruning";
  if ([45, 48].includes(code)) return "Avoid heavy watering";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return "Skip watering outdoor plants";
  }
  if ([95, 96, 99].includes(code)) return "Move balcony pots to shelter";
  return "Perfect day for repotting";
}
