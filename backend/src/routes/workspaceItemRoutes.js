import { Router } from "express";

import { requireAuth } from "../middleware/authMiddleware.js";
import { createWorkspaceItem, deleteWorkspaceItem, listWorkspaceItems, updateWorkspaceItem } from "../controllers/workspaceItemController.js";

export const workspaceItemRouter = Router();

workspaceItemRouter.use(requireAuth);
workspaceItemRouter.get("/", listWorkspaceItems);
workspaceItemRouter.post("/", createWorkspaceItem);
workspaceItemRouter.put("/:itemId", updateWorkspaceItem);
workspaceItemRouter.delete("/:itemId", deleteWorkspaceItem);