import { logger } from "../utils/logger.js";

const DEFAULT_MODEL = "gemini-2.0-flash";
const REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS || 8000);

// ============================================================================
// Prompt Builders
// ============================================================================

function buildSummaryPrompt(data) {
  return [
    "You are Prodesk's workspace operations assistant.",
    "Analyze the supplied workspace snapshot and return a concise, practical summary for the owner.",
    "Mention overall progress, the most important focus area, and one next step.",
    "Use plain text with three short labeled lines: Snapshot:, Focus:, Next step:.",
    "Do not invent facts, do not mention private credentials, and do not perform actions.",
    `Workspace snapshot: ${JSON.stringify(data)}`,
  ].join("\n");
}

function buildEnrichmentPrompt({ title, description, priority }) {
  return [
    "You are an operations assistant categorizing and tagging workspace tasks.",
    `Task Title: "${title}"`,
    `Task Description: "${description || "None provided"}"`,
    `Priority: "${priority}"`,
    "",
    "Categorize this task into exactly ONE category from: Engineering, Design, Operations, Quality, Documentation, Research, Product, General.",
    "Provide 2 to 4 concise lowercase tags.",
    "Provide a 1-sentence actionable operational summary.",
    "",
    'Respond ONLY with valid JSON in this format: {"category":"...","tags":["..."],"aiSummary":"..."}',
  ].join("\n");
}

// ============================================================================
// Intelligent Rule-Based Fallbacks (Zero-Downtime Guarantee)
// ============================================================================

export function generateHeuristicSummary({ metrics, items }) {
  const total = metrics?.total || 0;
  const completed = metrics?.completed || 0;
  const active = metrics?.active || 0;
  const overdue = metrics?.overdue || 0;

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

export function generateHeuristicEnrichment({ title, description, priority }) {
  const text = `${title} ${description}`.toLowerCase();

  let category = "General";
  const tags = new Set();

  if (/\b(ui|ux|css|mobile|responsive|layout|design|theme|modal|view|frontend)\b/.test(text)) {
    category = "Design";
    tags.add("design");
    if (/\b(mobile|responsive)\b/.test(text)) tags.add("mobile");
    if (/\b(ui|ux)\b/.test(text)) tags.add("ui");
  } else if (/\b(api|auth|jwt|backend|db|database|mongo|server|endpoint|route)\b/.test(text)) {
    category = "Engineering";
    tags.add("backend");
    if (/\b(auth|jwt)\b/.test(text)) tags.add("security");
    if (/\b(api|endpoint)\b/.test(text)) tags.add("api");
  } else if (/\b(test|audit|qa|verify|check|bug|fix|lint|lighthouse)\b/.test(text)) {
    category = "Quality";
    tags.add("quality");
    if (/\b(audit|lighthouse)\b/.test(text)) tags.add("performance");
    if (/\b(bug|fix)\b/.test(text)) tags.add("bugfix");
  } else if (/\b(deploy|ci|cd|docker|pipeline|render|railway|vercel)\b/.test(text)) {
    category = "Operations";
    tags.add("devops");
    tags.add("deployment");
  } else if (/\b(doc|docs|readme|guide|spec|manual)\b/.test(text)) {
    category = "Documentation";
    tags.add("docs");
  } else {
    tags.add("task");
    tags.add(priority || "medium");
  }

  const aiSummary = `${category} task focusing on "${title}". Priority set to ${priority}.`;

  return {
    category,
    tags: Array.from(tags).slice(0, 4),
    aiSummary,
    enrichedBy: "rule-engine",
  };
}

// ============================================================================
// Service Core Methods
// ============================================================================

export async function generateWorkspaceSummary({ metrics, items }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: buildSummaryPrompt({
                      metrics,
                      items: items.slice(0, 50).map((i) => ({
                        title: i.title,
                        status: i.status,
                        priority: i.priority,
                        dueDate: i.dueDate,
                      })),
                    }),
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0.2, maxOutputTokens: 250 },
          }),
        },
      );

      if (response.ok) {
        const payload = await response.json().catch(() => ({}));
        const summary = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (summary) {
          logger.info("Generated AI operational summary via Gemini LLM");
          return { success: true, summary, provider: "gemini" };
        }
      } else {
        logger.warn(`Gemini API returned status ${response.status}`);
      }
    } catch (error) {
      logger.warn(`Gemini LLM request failed or timed out: ${error.message}`);
    }
  }

  // Graceful fallback
  logger.info("Generated operational summary using local heuristic engine");
  const summary = generateHeuristicSummary({ metrics, items });
  return {
    success: true,
    summary,
    provider: apiKey ? "gemini-fallback" : "operational-engine",
  };
}

export async function enrichWorkspaceItem({ title, description, priority }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: buildEnrichmentPrompt({ title, description, priority }) }],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 150,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (response.ok) {
        const payload = await response.json().catch(() => ({}));
        const rawJson = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          if (parsed && typeof parsed.category === "string") {
            logger.info(`Enriched workspace item "${title}" via Gemini`);
            return {
              category: parsed.category.slice(0, 50),
              tags: Array.isArray(parsed.tags)
                ? parsed.tags.map((t) => String(t).toLowerCase().slice(0, 30)).slice(0, 4)
                : [],
              aiSummary: typeof parsed.aiSummary === "string" ? parsed.aiSummary.slice(0, 250) : "",
              enrichedBy: "gemini",
            };
          }
        }
      } else {
        logger.warn(`Gemini enrichment returned status ${response.status}`);
      }
    } catch (error) {
      logger.warn(`Gemini enrichment failed or timed out: ${error.message}`);
    }
  }

  // Non-blocking fallback enrichment
  logger.info(`Enriched workspace item "${title}" using heuristic rule engine`);
  return generateHeuristicEnrichment({ title, description, priority });
}
