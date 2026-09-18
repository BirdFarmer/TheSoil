import type { Coordinates, ElevationResult } from "../types";

interface OpenMeteoElevationResponse {
  elevation: number[];
}

interface OpenElevationResponse {
  results: { elevation: number }[];
}

async function fetchFromOpenMeteo({ lat, lng }: Coordinates): Promise<number> {
  const url = new URL("https://api.open-meteo.com/v1/elevation");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo elevation request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as OpenMeteoElevationResponse;
  const elevation = data.elevation?.[0];
  if (elevation === undefined) {
    throw new Error("Open-Meteo elevation returned no data for these coordinates");
  }
  return elevation;
}

async function fetchFromOpenElevation({ lat, lng }: Coordinates): Promise<number> {
  const url = new URL("https://api.open-elevation.com/api/v1/lookup");
  url.searchParams.set("locations", `${lat},${lng}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Elevation request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as OpenElevationResponse;
  const elevation = data.results?.[0]?.elevation;
  if (elevation === undefined) {
    throw new Error("Open-Elevation returned no data for these coordinates");
  }
  return elevation;
}

/**
 * Fetches elevation using Open-Meteo (fast, reliable) and falls back to the
 * public Open-Elevation instance if that fails.
 */
export async function fetchElevation(coordinates: Coordinates): Promise<ElevationResult> {
  try {
    const elevationMeters = await fetchFromOpenMeteo(coordinates);
    return { source: "open-meteo", confidence: "estimated", elevationMeters };
  } catch (primaryError) {
    try {
      const elevationMeters = await fetchFromOpenElevation(coordinates);
      return { source: "open-elevation", confidence: "estimated", elevationMeters };
    } catch (fallbackError) {
      throw new Error(
        `Both elevation providers failed. Primary: ${(primaryError as Error).message}. Fallback: ${(fallbackError as Error).message}`
      );
    }
  }
}
