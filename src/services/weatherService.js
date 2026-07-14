import { getSetting, setSetting } from "../storage/database";

const SURJANI_TOWN_COORDINATES = {
  latitude: 25.040071,
  longitude: 67.062393,
};

const WEATHERAPI_KEY =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_WEATHERAPI_KEY) ||
  "f18d30b3c83348fa810124040261407";
const WEATHER_CACHE_KEY = "surjani_town_weather_cache";
const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000;
const FORECAST_DAYS = 7;

const fallbackWeather = {
  temperature: 24,
  feelsLike: 24,
  humidity: 65,
  windSpeed: 5,
  condition: "Sunny",
  careTip: "Perfect day for repotting",
  weatherCode: 0,
  daily: createFallbackForecast(),
  updatedAt: null,
  isFallback: true,
};

export async function getSurjaniTownWeather({ forceRefresh = false } = {}) {
  const cachedWeather = await getCachedWeather();

  if (!forceRefresh && cachedWeather && isFresh(cachedWeather.updatedAt) && hasDailyForecast(cachedWeather)) {
    return cachedWeather;
  }

  try {
    const weather = await fetchSurjaniTownWeatherFromOpenMeteo();
    await setSetting(WEATHER_CACHE_KEY, JSON.stringify(weather));
    return weather;
  } catch {
    try {
      const weather = await fetchSurjaniTownWeatherFromWeatherApi();
      await setSetting(WEATHER_CACHE_KEY, JSON.stringify(weather));
      return weather;
    } catch {
      return cachedWeather ?? fallbackWeather;
    }
  }
}

async function fetchSurjaniTownWeatherFromWeatherApi() {
  const params = new URLSearchParams({
    key: WEATHERAPI_KEY,
    q: `${SURJANI_TOWN_COORDINATES.latitude},${SURJANI_TOWN_COORDINATES.longitude}`,
    days: String(FORECAST_DAYS),
    aqi: "no",
    alerts: "no",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?${params.toString()}`,
      { signal: controller.signal },
    );

    if (!response.ok) {
      throw new Error("WeatherAPI request failed");
    }

    const data = await response.json();
    const current = data.current ?? {};
    const condition = current.condition ?? {};
    const weatherCode = normalizeWeatherApiCode(condition.code, condition.text);

    return {
      temperature: Math.round(Number(current.temp_c ?? 24)),
      feelsLike: Math.round(Number(current.feelslike_c ?? current.temp_c ?? 24)),
      humidity: Math.round(Number(current.humidity ?? 65)),
      windSpeed: Math.round(Number(current.wind_kph ?? 5)),
      condition: normalizeConditionText(condition.text, weatherCode),
      careTip: getGardenCareTip(weatherCode),
      weatherCode,
      daily: normalizeWeatherApiDailyForecast(data.forecast?.forecastday),
      updatedAt: new Date().toISOString(),
      isFallback: false,
      provider: "weatherapi",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSurjaniTownWeatherFromOpenMeteo() {
  const params = new URLSearchParams({
    latitude: String(SURJANI_TOWN_COORDINATES.latitude),
    longitude: String(SURJANI_TOWN_COORDINATES.longitude),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum",
    forecast_days: String(FORECAST_DAYS),
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
    const daily = normalizeDailyForecast(data.daily);

    return {
      temperature: Math.round(Number(current.temperature_2m ?? 24)),
      feelsLike: Math.round(Number(current.apparent_temperature ?? current.temperature_2m ?? 24)),
      humidity: Math.round(Number(current.relative_humidity_2m ?? 65)),
      windSpeed: Math.round(Number(current.wind_speed_10m ?? 5)),
      condition: getWeatherCondition(weatherCode),
      careTip: getGardenCareTip(weatherCode),
      weatherCode,
      daily,
      updatedAt: new Date().toISOString(),
      isFallback: false,
      provider: "open-meteo",
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

function hasDailyForecast(weather) {
  return Array.isArray(weather?.daily) && weather.daily.length >= FORECAST_DAYS;
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

function normalizeDailyForecast(daily = {}) {
  const dates = daily.time ?? [];
  const maxTemps = daily.temperature_2m_max ?? [];
  const minTemps = daily.temperature_2m_min ?? [];
  const rainChances = daily.precipitation_probability_max ?? [];
  const rainAmounts = daily.precipitation_sum ?? [];
  const weatherCodes = daily.weather_code ?? [];

  return dates.slice(0, FORECAST_DAYS).map((date, index) => {
    const weatherCode = Number(weatherCodes[index] ?? 0);

    return {
      date,
      label: getForecastDayLabel(index, date),
      minTemp: Math.round(Number(minTemps[index] ?? 0)),
      maxTemp: Math.round(Number(maxTemps[index] ?? 0)),
      rainChance: Math.round(Number(rainChances[index] ?? 0)),
      rainAmount: roundRainAmount(Number(rainAmounts[index] ?? 0)),
      weatherCode,
      condition: getWeatherCondition(weatherCode),
    };
  });
}

function normalizeWeatherApiDailyForecast(days = []) {
  return days.slice(0, FORECAST_DAYS).map((forecastDay, index) => {
    const day = forecastDay.day ?? {};
    const condition = day.condition ?? {};
    const weatherCode = normalizeWeatherApiCode(condition.code, condition.text);

    return {
      date: forecastDay.date,
      label: getForecastDayLabel(index, forecastDay.date),
      minTemp: Math.round(Number(day.mintemp_c ?? 0)),
      maxTemp: Math.round(Number(day.maxtemp_c ?? 0)),
      rainChance: Math.round(Number(day.daily_chance_of_rain ?? 0)),
      rainAmount: roundRainAmount(Number(day.totalprecip_mm ?? 0)),
      weatherCode,
      condition: normalizeConditionText(condition.text, weatherCode),
    };
  });
}

function normalizeWeatherApiCode(code, text = "") {
  const numericCode = Number(code);
  const normalizedText = String(text).toLowerCase();

  if ([1273, 1276, 1279, 1282].includes(numericCode) || normalizedText.includes("thunder")) {
    return 95;
  }

  if (
    [
      1063, 1072, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195,
      1198, 1201, 1240, 1243, 1246,
    ].includes(numericCode) ||
    normalizedText.includes("rain")
  ) {
    return normalizedText.includes("drizzle") ? 51 : 61;
  }

  if (
    [
      1066, 1069, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225,
      1237, 1249, 1252, 1255, 1258, 1261, 1264,
    ].includes(numericCode) ||
    normalizedText.includes("snow") ||
    normalizedText.includes("sleet") ||
    normalizedText.includes("ice")
  ) {
    return 71;
  }

  if ([1030, 1135, 1147].includes(numericCode) || normalizedText.includes("fog") || normalizedText.includes("mist")) {
    return 45;
  }

  if (numericCode === 1009 || normalizedText.includes("overcast")) {
    return 3;
  }

  if (numericCode === 1006 || normalizedText.includes("cloudy")) {
    return 2;
  }

  if (numericCode === 1003 || normalizedText.includes("partly")) {
    return 1;
  }

  return 0;
}

function normalizeConditionText(text, weatherCode) {
  const value = String(text ?? "").trim();

  if (value) {
    return value;
  }

  return getWeatherCondition(weatherCode);
}

function getForecastDayLabel(index, date) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

function roundRainAmount(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 10) / 10;
}

function createFallbackForecast() {
  return Array.from({ length: FORECAST_DAYS }, (_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const dateKey = date.toISOString().slice(0, 10);

    return {
      date: dateKey,
      label: getForecastDayLabel(offset, dateKey),
      minTemp: 22,
      maxTemp: 30,
      rainChance: 0,
      rainAmount: 0,
      weatherCode: 0,
      condition: "Sunny",
    };
  });
}
