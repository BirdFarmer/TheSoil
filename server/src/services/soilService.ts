import type { Coordinates, SoilSummary } from "../types";

interface SoilGridsLayer {
  name: "phh2o" | "sand" | "silt" | "clay" | "soc";
  unit_measure: { d_factor: number };
  depths: { label: string; values: { mean: number | null } }[];
}

interface SoilGridsResponse {
  properties: { layers: SoilGridsLayer[] };
}

const DEPTH = "0-5cm";
const TIMEOUT_MS = 15_000; // the public ISRIC endpoint is notoriously slow/unreliable

function readLayerValue(layers: SoilGridsLayer[], name: SoilGridsLayer["name"]): number | null {
  const layer = layers.find((l) => l.name === name);
  const depth = layer?.depths.find((d) => d.label === DEPTH);
  const raw = depth?.values.mean;
  if (raw === null || raw === undefined || !layer) return null;
  return Number((raw / layer.unit_measure.d_factor).toFixed(2));
}

/**
 * Fetches soil pH/type estimate from ISRIC SoilGrids. Returns available:false
 * (rather than throwing) when SoilGrids has no data for the point or times out,
 * so a slow/unreliable soil lookup never blocks climate/elevation results.
 */
export async function fetchSoilSummary({ lat, lng }: Coordinates): Promise<SoilSummary> {
  const url = new URL("https://rest.isric.org/soilgrids/v2.0/properties/query");
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("lat", String(lat));
  for (const property of ["phh2o", "sand", "silt", "clay", "soc"]) {
    url.searchParams.append("property", property);
  }
  url.searchParams.set("depth", DEPTH);
  url.searchParams.set("value", "mean");

  const unavailable = (note: string): SoilSummary => ({
    source: "isric-soilgrids",
    confidence: "estimated",
    depth: DEPTH,
    phH2O: null,
    sandPercent: null,
    siltPercent: null,
    clayPercent: null,
    soilOrganicCarbonGPerKg: null,
    available: false,
    note,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      return unavailable(`SoilGrids request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as SoilGridsResponse;
    const layers = data.properties?.layers ?? [];
    const phH2O = readLayerValue(layers, "phh2o");

    return {
      source: "isric-soilgrids",
      confidence: "estimated",
      depth: DEPTH,
      phH2O,
      sandPercent: readLayerValue(layers, "sand"),
      siltPercent: readLayerValue(layers, "silt"),
      clayPercent: readLayerValue(layers, "clay"),
      soilOrganicCarbonGPerKg: readLayerValue(layers, "soc"),
      available: phH2O !== null,
      ...(phH2O === null ? { note: "SoilGrids has no modeled data for this exact point." } : {}),
    };
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "SoilGrids did not respond in time."
      : `SoilGrids request error: ${(error as Error).message}`;
    return unavailable(message);
  } finally {
    clearTimeout(timeout);
  }
}
