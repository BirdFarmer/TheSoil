export interface Coordinates {
  lat: number;
  lng: number;
}

/** Marks whether a data point came from an external API or was confirmed by the user. */
export type DataConfidence = "estimated" | "user-confirmed";

export interface ClimateSummary {
  source: "open-meteo";
  confidence: DataConfidence;
  periodStart: string;
  periodEnd: string;
  avgTempC: number;
  minTempC: number;
  maxTempC: number;
  totalPrecipitationMm: number;
  rainyDays: number;
  timezone: string;
}

export interface ElevationResult {
  source: "open-meteo" | "open-elevation";
  confidence: DataConfidence;
  elevationMeters: number;
}

export interface EnvironmentData {
  coordinates: Coordinates;
  climate: ClimateSummary;
  elevation: ElevationResult;
}
