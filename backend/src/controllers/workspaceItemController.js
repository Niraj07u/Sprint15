import mongoose from "mongoose";

import { WorkspaceItem } from "../models/WorkspaceItem.js";
import { enrichWorkspaceItem } from "../services/aiService.js";
import { memoryStore } from "../utils/fallbackStore.js";
import { logger } from "../utils/logger.js";

const statuses = new Set(["planned", "in-progress", "completed"]);
const priorities = new Set(["low", "medium", "high"]);

function validatePayload(payload, partial = false) {
  const { title, description, status, priority, dueDate } = payload ?? {};
  if (!partial || title !== undefined) {
    if (typeof title !== "string" || title.trim().length < 1 || title.trim().length > 120) {
      return "Title must be between 1 and 120 characters.";
    }
  }
  if (
    description !== undefined &&
    (typeof description !== "string" || description.trim().length > 500)
  ) {
    return "Description must be 500 characters or fewer.";
  }
  if (status !== undefined && !statuses.has(status)) return "Choose a valid status.";
  if (priority !== undefined && !priorities.has(priority)) return "Choose a valid priority.";
  if (
    dueDate !== undefined &&
    dueDate !== null &&
    (typeof dueDate !== "string" || Number.isNaN(Date.parse(dueDate)))
  ) {
    return "Choose a valid due date.";
  }
  return null;
}

function normalizePayload(payload) {
  const normalized = { ...payload };
  if (typeof normalized.title === "string") normalized.title = normalized.title.trim();
  if (typeof normalized.description === "string") {
    normalized.description = normalized.description.trim();
  }
  if (normalized.dueDate === "") normalized.dueDate = null;
  return normalized;
}

export async function listWorkspaceItems(request, response, next) {
  if (mongoose.connection.readyState === 1) {
    try {
      const items = await WorkspaceItem.find({ userId: request.user.id })
        .sort({ createdAt: -1 })
        .lean();
      return response.status(200).json({ success: true, items });
    } catch (error) {
      logger.error(`Error listing workspace items: ${error.message}`);
      return next(error);
    }
  }

  const items = memoryStore.listItems(request.user.id);
  return response.status(200).json({ success: true, items });
}

export async function createWorkspaceItem(request, response, next) {
  const validationMessage = validatePayload(request.body);
  if (validationMessage) {
    return response.status(400).json({ success: false, message: validationMessage });
  }

  const basePayload = normalizePayload(request.body);

  // Execute AI enrichment pipeline before persistence
  let enrichment = { category: "General", tags: [], aiSummary: "" };
  try {
    enrichment = await enrichWorkspaceItem({
      title: basePayload.title,
      description: basePayload.description,
      priority: basePayload.priority,
    });
  } catch (enrichError) {
    logger.warn(`AI enrichment pipeline degraded: ${enrichError.message}`);
  }

  const fullPayload = {
    ...basePayload,
    category: enrichment.category || "General",
    tags: Array.isArray(enrichment.tags) ? enrichment.tags : [],
    aiSummary: enrichment.aiSummary || "",
    userId: request.user.id,
  };

  if (mongoose.connection.readyState === 1) {
    try {
      const item = await WorkspaceItem.create(fullPayload);
      logger.info(`Created workspace item "${item.title}" for user ${request.user.id}`);
      return response.status(201).json({ success: true, item });
    } catch (error) {
      logger.error(`Error creating workspace item in MongoDB: ${error.message}`);
      return next(error);
    }
  }

  const item = memoryStore.createItem(fullPayload, request.user.id);
  logger.info(`Created workspace item "${item.title}" in local store for user ${request.user.id}`);
  return response.status(201).json({ success: true, item });
}

export async function updateWorkspaceItem(request, response, next) {
  const validationMessage = validatePayload(request.body, true);
  if (validationMessage) {
    return response.status(400).json({ success: false, message: validationMessage });
  }

  if (mongoose.connection.readyState === 1) {
    if (!mongoose.isValidObjectId(request.params.itemId)) {
      return response.status(404).json({ success: false, message: "Workspace item not found." });
    }
    try {
      const item = await WorkspaceItem.findOneAndUpdate(
        { _id: request.params.itemId, userId: request.user.id },
        normalizePayload(request.body),
        { new: true, runValidators: true },
      );
      if (!item) {
        return response.status(404).json({ success: false, message: "Workspace item not found." });
      }
      return response.status(200).json({ success: true, item });
    } catch (error) {
      logger.error(`Error updating workspace item: ${error.message}`);
      return next(error);
    }
  }

  const item = memoryStore.updateItem(
    request.params.itemId,
    normalizePayload(request.body),
    request.user.id,
  );
  if (!item) {
    return response.status(404).json({ success: false, message: "Workspace item not found." });
  }
  return response.status(200).json({ success: true, item });
}

export async function deleteWorkspaceItem(request, response, next) {
  if (mongoose.connection.readyState === 1) {
    if (!mongoose.isValidObjectId(request.params.itemId)) {
      return response.status(404).json({ success: false, message: "Workspace item not found." });
    }
    try {
      const item = await WorkspaceItem.findOneAndDelete({
        _id: request.params.itemId,
        userId: request.user.id,
      });
      if (!item) {
        return response.status(404).json({ success: false, message: "Workspace item not found." });
      }
      return response.status(204).end();
    } catch (error) {
      logger.error(`Error deleting workspace item: ${error.message}`);
      return next(error);
    }
  }

  const deleted = memoryStore.deleteItem(request.params.itemId, request.user.id);
  if (!deleted) {
    return response.status(404).json({ success: false, message: "Workspace item not found." });
  }
  return response.status(204).end();
}