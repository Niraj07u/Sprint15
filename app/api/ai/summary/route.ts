import { NextResponse } from "next/server";

const defaultModel = "gemini-2.0-flash";

function buildPrompt(data: unknown) {
  return [
    "You are Prodesk's workspace operations assistant.",
    "Analyze the supplied workspace snapshot and return a concise, practical summary for the owner.",
    "Mention overall progress, the most important focus area, and one next step.",
    "Use plain text with three short labeled lines: Snapshot:, Focus:, Next step:.",
    "Do not invent facts, do not mention private credentials, and do not perform actions.",
    `Workspace snapshot: ${JSON.stringify(data)}`,
  ].join("\n");
}

type MetricPayload = {
  total?: number;
  completed?: number;
  active?: number;
  overdue?: number;
};

type ItemPayload = {
  title: string;
  status: "planned" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
};

function generateHeuristicSummary({ metrics, items }: { metrics: MetricPayload; items: ItemPayload[] }) {
  const total = metrics?.total ?? 0;
  const completed = metrics?.completed ?? 0;
  const active = metrics?.active ?? 0;
  const overdue = metrics?.overdue ?? 0;

  if (total === 0) {
    return [
      "Snapshot: The workspace currently has no items recorded.",
      "Focus: Initialize your project board by defining immediate milestones.",
      "Next step: Click '+ New item' to add your first task with priority and target due date.",
    ].join("\n");
  }

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const highPriority = items.filter((i) => i.priority === "high" && i.status !== "completed");
  const inProgress = items.filter((i) => i.status === "in-progress");

  let snapshot = `Snapshot: Tracking ${total} total items with ${completed} completed (${completionRate}%) and ${active} active.`;
  if (overdue > 0) {
    snapshot += ` Caution: ${overdue} item${overdue > 1 ? "s are" : " is"} overdue.`;
  }

  let focus = "Focus: Maintain steady momentum on planned items.";
  if (overdue > 0) {
    focus = `Focus: Immediately resolve or reschedule the ${overdue} overdue item${overdue > 1 ? "s" : ""}.`;
  } else if (highPriority.length > 0) {
    focus = `Focus: Target high-priority item "${highPriority[0].title}" to unblock workflow.`;
  } else if (inProgress.length > 0) {
    focus = `Focus: Finalize "${inProgress[0].title}" before transitioning new items into active work.`;
  }

  let nextStep = "Next step: Review upcoming task deadlines and maintain status updates.";
  if (overdue > 0) {
    nextStep = "Next step: Address the overdue items today to restore sprint pacing.";
  } else if (highPriority.length > 0) {
    nextStep = `Next step: Focus efforts on "${highPriority[0].title}" and mark progress.`;
  } else if (active > 0) {
    nextStep = "Next step: Complete active work in progress to increase completion rate.";
  }

  return [snapshot, focus, nextStep].join("\n");
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { metrics, items } = body as { metrics?: MetricPayload; items?: ItemPayload[] };

    if (!metrics || !Array.isArray(items)) {
      return NextResponse.json({ success: false, message: "A valid workspace snapshot is required." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const model = process.env.GEMINI_MODEL || defaultModel;
        const providerResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: buildPrompt({ metrics, items: items.slice(0, 100) }) }] }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 250 },
            }),
          },
        );

        if (providerResponse.ok) {
          const payload = await providerResponse.json().catch(() => ({}));
          const summary = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (summary) {
            return NextResponse.json({ success: true, summary, provider: "gemini" });
          }
        }
      } catch {
        // Fallback to operational engine
      }
    }

    const summary = generateHeuristicSummary({ metrics, items });
    return NextResponse.json({
      success: true,
      summary,
      provider: apiKey ? "gemini-fallback" : "operational-engine",
    });
  } catch {
    return NextResponse.json({ success: false, message: "An unexpected error occurred." }, { status: 500 });
  }
}
