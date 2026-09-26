"use client";

import { useState } from "react";
import { generateWorkspaceSummary, type ParsedAiSummary, type WorkspaceAiSnapshot } from "@/lib/ai";
import { useToast } from "@/components/toast/toast-context";
import { ApiError } from "@/lib/api-client";

type AiSummaryCardProps = {
  snapshot: WorkspaceAiSnapshot;
  token: string;
};

export function AiSummaryCard({ snapshot, token }: AiSummaryCardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<ParsedAiSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalItems = snapshot.metrics.total;

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateWorkspaceSummary(token, snapshot);
      setSummary(result.parsed);
      toast.success("AI operational summary generated.");
    } catch (caughtError) {
      const message =
        caughtError instanceof ApiError
          ? caughtError.message
          : caughtError instanceof Error
            ? caughtError.message
            : "Failed to generate AI summary.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!summary) return;
    const textToCopy = `Workspace Operations Summary (${summary.generatedAt})\n\nSnapshot: ${summary.snapshot}\nFocus: ${summary.focus}\nNext step: ${summary.nextStep}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.info("Summary copied to clipboard.");
    } catch {
      toast.error("Unable to copy to clipboard.");
    }
  }

  return (
    <article aria-labelledby="ai-summary-heading" className="panel ai-panel">
      <div className="panel-heading">
        <div>
          <div className="ai-badge-row">
            <span className="ai-pill">
              <svg
                aria-hidden="true"
                fill="none"
                height="14"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="14"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              AI Assistant
            </span>
            <p className="eyebrow" style={{ margin: 0 }}>Executive Intelligence</p>
          </div>
          <h2 id="ai-summary-heading">Operational Insights</h2>
        </div>

        {totalItems > 0 && (
          <button
            aria-busy={isLoading}
            className="ai-generate-button"
            disabled={isLoading}
            onClick={handleGenerate}
            type="button"
          >
            {isLoading ? (
              <>
                <span className="spinner spinner-small" />
                <span>Analyzing…</span>
              </>
            ) : summary ? (
              <>
                <svg
                  aria-hidden="true"
                  fill="none"
                  height="16"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="16"
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                <span>Refresh Insights</span>
              </>
            ) : (
              <>
                <svg
                  aria-hidden="true"
                  fill="none"
                  height="16"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="16"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>Generate AI Summary</span>
              </>
            )}
          </button>
        )}
      </div>

      {isLoading ? (
        <div aria-busy="true" aria-live="polite" className="ai-loading-state">
          <div className="ai-pulse-indicator">
            <span className="pulse-dot" />
            <p>Synthesizing workspace metrics and active items…</p>
          </div>
          <div className="ai-skeleton-group">
            <div className="skeleton skeleton-text" style={{ width: "85%" }} />
            <div className="skeleton skeleton-text" style={{ width: "95%" }} />
            <div className="skeleton skeleton-text" style={{ width: "70%" }} />
          </div>
        </div>
      ) : error ? (
        <div className="ai-error-state" role="alert">
          <p className="ai-error-text">{error}</p>
          <button className="button-secondary" onClick={handleGenerate} type="button">
            Try again
          </button>
        </div>
      ) : summary ? (
        <div className="ai-content-body">
          <div className="ai-grid">
            <div className="ai-card">
              <div className="ai-card-header">
                <span className="ai-card-indicator ai-indicator-snapshot" />
                <h3>Snapshot</h3>
              </div>
              <p>{summary.snapshot}</p>
            </div>

            <div className="ai-card">
              <div className="ai-card-header">
                <span className="ai-card-indicator ai-indicator-focus" />
                <h3>Primary Focus</h3>
              </div>
              <p>{summary.focus}</p>
            </div>

            <div className="ai-card">
              <div className="ai-card-header">
                <span className="ai-card-indicator ai-indicator-next" />
                <h3>Recommended Action</h3>
              </div>
              <p>{summary.nextStep}</p>
            </div>
          </div>

          <div className="ai-footer">
            <span className="ai-timestamp">
              Generated at {summary.generatedAt} · {summary.provider || "Gemini 2.0"}
            </span>
            <button className="ai-copy-button" onClick={handleCopy} type="button">
              <svg
                aria-hidden="true"
                fill="none"
                height="14"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="14"
              >
                <rect height="13" rx="2" ry="2" width="13" x="9" y="9" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy summary
            </button>
          </div>
        </div>
      ) : totalItems === 0 ? (
        <div className="ai-empty-state">
          <p>
            Add items to your workspace to unlock AI-driven operational snapshots, focus recommendations, and prioritized next steps.
          </p>
        </div>
      ) : (
        <div className="ai-empty-state">
          <p>
            Analyze your {totalItems} workspace item{totalItems > 1 ? "s" : ""} to generate an instant executive summary and prioritized actions.
          </p>
          <button className="button-primary" onClick={handleGenerate} type="button">
            Generate operational insight
          </button>
        </div>
      )}
    </article>
  );
}
