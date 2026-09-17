import type { WorkspaceItem } from "./api-client";

export type WorkspaceMetrics = {
  total: number;
  completed: number;
  active: number;
  overdue: number;
  byStatus: { name: string; value: number }[];
  byPriority: { name: string; value: number }[];
};

export function getWorkspaceMetrics(items: WorkspaceItem[], today = new Date()): WorkspaceMetrics {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const completed = items.filter((item) => item.status === "completed").length;
  const overdue = items.filter((item) => item.status !== "completed" && item.dueDate && new Date(item.dueDate).getTime() < startOfToday).length;

  return {
    total: items.length,
    completed,
    active: items.length - completed,
    overdue,
    byStatus: [
      { name: "Planned", value: items.filter((item) => item.status === "planned").length },
      { name: "In progress", value: items.filter((item) => item.status === "in-progress").length },
      { name: "Completed", value: completed },
    ],
    byPriority: [
      { name: "Low", value: items.filter((item) => item.priority === "low").length },
      { name: "Medium", value: items.filter((item) => item.priority === "medium").length },
      { name: "High", value: items.filter((item) => item.priority === "high").length },
    ],
  };
}