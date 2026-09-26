import { Router } from "express";

import { requireAuth } from "../middleware/authMiddleware.js";
import {
  createWorkspaceItem,
  deleteWorkspaceItem,
  listWorkspaceItems,
  updateWorkspaceItem,
} from "../controllers/workspaceItemController.js";
import { generalApiLimiter } from "../middleware/rateLimiter.js";

export const workspaceItemRouter = Router();

workspaceItemRouter.use(requireAuth);
workspaceItemRouter.use(generalApiLimiter);

workspaceItemRouter.get("/", listWorkspaceItems);
workspaceItemRouter.post("/", createWorkspaceItem);
workspaceItemRouter.put("/:itemId", updateWorkspaceItem);
workspaceItemRouter.delete("/:itemId", deleteWorkspaceItem);