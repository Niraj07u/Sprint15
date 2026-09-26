"use client";

import { ApiError } from "./api-client";
import type { WorkspaceMetrics } from "./workspace-metrics";
import type { WorkspaceItem } from "./api-client";

export type WorkspaceAiSnapshot = {
  metrics: WorkspaceMetrics;
  items: Pick<WorkspaceItem, "title" | "status" | "priority" | "dueDate">[];
};

export type ParsedAiSummary = {
  snapshot: string;
  focus: string;
  nextStep: string;
  rawText: string;
  provider?: string;
  generatedAt: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function parseAiSummaryText(text: string, provider?: string): ParsedAiSummary {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  let snapshot = "";
  let focus = "";
  let nextStep = "";

  for (const line of lines) {
    if (/^snapshot\s*:/i.test(line)) {
      snapshot = line.replace(/^snapshot\s*:/i, "").trim();
    } else if (/^focus\s*:/i.test(line)) {
      focus = line.replace(/^focus\s*:/i, "").trim();
    } else if (/^next\s*step\s*:/i.test(line)) {
      nextStep = line.replace(/^next\s*step\s*:/i, "").trim();
    }
  }

  // Fallbacks if formatting differed
  if (!snapshot && lines[0]) snapshot = lines[0];
  if (!focus && lines[1]) focus = lines[1];
  if (!nextStep && lines[2]) nextStep = lines[2];

  return {
    snapshot: snapshot || "Operations proceeding according to schedule.",
    focus: focus || "Maintain sprint momentum on active items.",
    nextStep: nextStep || "Review upcoming due dates and groom task backlog.",
    rawText: text,
    provider: provider || "Gemini Operations Engine",
    generatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

export async function generateWorkspaceSummary(
  token: string,
  snapshot: WorkspaceAiSnapshot,
): Promise<{ raw: string; parsed: ParsedAiSummary; provider?: string }> {
  // Sanitize snapshot: limit to 50 items and exclude any unnecessary properties
  const sanitizedSnapshot: WorkspaceAiSnapshot = {
    metrics: {
      total: snapshot.metrics.total,
      completed: snapshot.metrics.completed,
      active: snapshot.metrics.active,
      overdue: snapshot.metrics.overdue,
      byStatus: snapshot.metrics.byStatus,
      byPriority: snapshot.metrics.byPriority,
    },
    items: (snapshot.items || []).slice(0, 50).map((item) => ({
      title: item.title,
      status: item.status,
      priority: item.priority,
      dueDate: item.dueDate,
    })),
  };

  const payloadBody = JSON.stringify(sanitizedSnapshot);
  let response: Response | null = null;
  let lastError: Error | null = null;

  // Primary attempt: Express backend
  try {
    response = await fetch(`${apiUrl}/api/ai/summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: payloadBody,
    });
  } catch (err) {
    lastError = err instanceof Error ? err : new Error(String(err));
  }

  // Fallback attempt: Next.js internal API route (e.g. on Vercel deployment)
  if (!response || !response.ok) {
    try {
      const fallbackResponse = await fetch(`/api/ai/summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: payloadBody,
      });
      if (fallbackResponse.ok) {
        response = fallbackResponse;
      }
    } catch {
      // Keep original response or error
    }
  }

  if (!response) {
    throw new ApiError(
      lastError ? lastError.message : "Unable to reach the AI service. Please try again.",
      0,
    );
  }

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
    summary?: string;
    provider?: string;
  };

  if (!response.ok || !payload.summary) {
    throw new ApiError(payload.message || "Unable to generate an AI summary.", response.status);
  }

  const parsed = parseAiSummaryText(payload.summary, payload.provider);

  return {
    raw: payload.summary,
    parsed,
    provider: payload.provider,
  };
}
