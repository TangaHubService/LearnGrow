import { Router } from "express";
import { asyncHandler } from "../../http/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";
import { startSessionController, endSessionController, joinSessionController } from "./virtual.controller.js";

export const virtualRouter = Router();

virtualRouter.use(requireAuth, requireTenant);

virtualRouter.post("/sessions/start", asyncHandler(startSessionController));
virtualRouter.post("/sessions/:sessionId/end", asyncHandler(endSessionController));
virtualRouter.post("/sessions/:sessionId/join", asyncHandler(joinSessionController));
