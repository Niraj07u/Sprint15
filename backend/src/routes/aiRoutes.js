import { Router } from "express";

import { handleWorkspaceSummary } from "../controllers/aiController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { aiLimiter } from "../middleware/rateLimiter.js";

export const aiRouter = Router();

aiRouter.use(requireAuth);
aiRouter.use(aiLimiter);

aiRouter.post("/summary", handleWorkspaceSummary);
aiRouter.post("/analyze", handleWorkspaceSummary);
