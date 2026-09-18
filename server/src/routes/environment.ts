import { Router, type Request, type Response } from "express";
import { fetchClimateSummary } from "../services/climateService";
import { fetchElevation } from "../services/elevationService";
import { fetchSoilSummary } from "../services/soilService";
import type { Coordinates, EnvironmentData } from "../types";

export const environmentRouter = Router();

function parseCoordinates(query: Request["query"]): Coordinates | null {
  const lat = Number(query.lat);
  const lng = Number(query.lng);

  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}

// GET /api/environment?lat=13.7563&lng=100.5018
environmentRouter.get("/environment", async (req: Request, res: Response) => {
  const coordinates = parseCoordinates(req.query);
  if (!coordinates) {
    return res.status(400).json({
      error: "Provide valid 'lat' (-90 to 90) and 'lng' (-180 to 180) query parameters.",
    });
  }

  try {
    // fetchSoilSummary never throws — a slow/unavailable SoilGrids lookup
    // degrades to available:false instead of failing the whole request.
    const [climate, elevation, soil] = await Promise.all([
      fetchClimateSummary(coordinates),
      fetchElevation(coordinates),
      fetchSoilSummary(coordinates),
    ]);

    const environmentData: EnvironmentData = { coordinates, climate, elevation, soil };
    res.json(environmentData);
  } catch (error) {
    console.error("Failed to fetch environment data:", error);
    res.status(502).json({
      error: "Failed to fetch climate/elevation data from upstream providers. Please try again.",
    });
  }
});
