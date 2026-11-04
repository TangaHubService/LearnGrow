import type { Request, Response } from "express";
import { getAnalyticsOverview } from "./analytics.service.js";

export async function getAnalyticsOverviewController(_req: Request, res: Response) {
  const metrics = await getAnalyticsOverview();
  res.json({ metrics });
}
