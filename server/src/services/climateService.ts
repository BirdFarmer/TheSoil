import type { ClimateSummary, Coordinates } from "../types";

interface OpenMeteoArchiveResponse {
  timezone: string;
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

/** Formats a Date as YYYY-MM-DD for the Open-Meteo API. */
function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Fetches the last 12 months of daily weather from Open-Meteo's free Archive API
 * and reduces it to a climate summary (avg/min/max temp, total rainfall, rainy days).
 */
export async function fetchClimateSummary({ lat, lng }: Coordinates): Promise<ClimateSummary> {
  const end = new Date();
  end.setDate(end.getDate() - 3); // archive data typically lags a few days behind
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 1);

  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("start_date", toDateString(start));
  url.searchParams.set("end_date", toDateString(end));
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo archive request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as OpenMeteoArchiveResponse;
  const { temperature_2m_max, temperature_2m_min, precipitation_sum, time } = data.daily;

  if (!time?.length) {
    throw new Error("Open-Meteo archive returned no daily data for these coordinates");
  }

  const avgOf = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;
  const dailyAvgTemps = temperature_2m_max.map((max, i) => (max + (temperature_2m_min[i] ?? max)) / 2);

  return {
    source: "open-meteo",
    confidence: "estimated",
    periodStart: time[0] as string,
    periodEnd: time[time.length - 1] as string,
    avgTempC: Number(avgOf(dailyAvgTemps).toFixed(1)),
    minTempC: Number(Math.min(...temperature_2m_min).toFixed(1)),
    maxTempC: Number(Math.max(...temperature_2m_max).toFixed(1)),
    totalPrecipitationMm: Number(precipitation_sum.reduce((sum, v) => sum + (v ?? 0), 0).toFixed(1)),
    rainyDays: precipitation_sum.filter((v) => (v ?? 0) >= 1).length,
    timezone: data.timezone,
  };
}
