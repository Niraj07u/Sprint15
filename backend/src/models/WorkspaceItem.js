import mongoose from "mongoose";

const workspaceItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    status: { type: String, enum: ["planned", "in-progress", "completed"], default: "planned" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true },
);

workspaceItemSchema.index({ userId: 1, createdAt: -1 });

export const WorkspaceItem = mongoose.models.WorkspaceItem || mongoose.model("WorkspaceItem", workspaceItemSchema);