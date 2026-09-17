import mongoose from "mongoose";

import { WorkspaceItem } from "../models/WorkspaceItem.js";

const statuses = new Set(["planned", "in-progress", "completed"]);
const priorities = new Set(["low", "medium", "high"]);

function validatePayload(payload, partial = false) {
  const { title, description, status, priority, dueDate } = payload ?? {};
  if (!partial || title !== undefined) {
    if (typeof title !== "string" || title.trim().length < 1 || title.trim().length > 120) return "Title must be between 1 and 120 characters.";
  }
  if (description !== undefined && (typeof description !== "string" || description.trim().length > 500)) return "Description must be 500 characters or fewer.";
  if (status !== undefined && !statuses.has(status)) return "Choose a valid status.";
  if (priority !== undefined && !priorities.has(priority)) return "Choose a valid priority.";
  if (dueDate !== undefined && dueDate !== null && (typeof dueDate !== "string" || Number.isNaN(Date.parse(dueDate)))) return "Choose a valid due date.";
  return null;
}

function normalizePayload(payload) {
  const normalized = { ...payload };
  if (typeof normalized.title === "string") normalized.title = normalized.title.trim();
  if (typeof normalized.description === "string") normalized.description = normalized.description.trim();
  if (normalized.dueDate === "") normalized.dueDate = null;
  return normalized;
}

export async function listWorkspaceItems(request, response, next) {
  try {
    const items = await WorkspaceItem.find({ userId: request.user.id }).sort({ createdAt: -1 }).lean();
    return response.status(200).json({ success: true, items });
  } catch (error) {
    return next(error);
  }
}

export async function createWorkspaceItem(request, response, next) {
  const validationMessage = validatePayload(request.body);
  if (validationMessage) return response.status(400).json({ success: false, message: validationMessage });
  try {
    const item = await WorkspaceItem.create({ ...normalizePayload(request.body), userId: request.user.id });
    return response.status(201).json({ success: true, item });
  } catch (error) {
    return next(error);
  }
}

export async function updateWorkspaceItem(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.itemId)) return response.status(404).json({ success: false, message: "Workspace item not found." });
  const validationMessage = validatePayload(request.body, true);
  if (validationMessage) return response.status(400).json({ success: false, message: validationMessage });
  try {
    const item = await WorkspaceItem.findOneAndUpdate(
      { _id: request.params.itemId, userId: request.user.id },
      normalizePayload(request.body),
      { new: true, runValidators: true },
    );
    if (!item) return response.status(404).json({ success: false, message: "Workspace item not found." });
    return response.status(200).json({ success: true, item });
  } catch (error) {
    return next(error);
  }
}

export async function deleteWorkspaceItem(request, response, next) {
  if (!mongoose.isValidObjectId(request.params.itemId)) return response.status(404).json({ success: false, message: "Workspace item not found." });
  try {
    const item = await WorkspaceItem.findOneAndDelete({ _id: request.params.itemId, userId: request.user.id });
    if (!item) return response.status(404).json({ success: false, message: "Workspace item not found." });
    return response.status(204).send();
  } catch (error) {
    return next(error);
  }
}