"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { useAuth, useToast } from "@/app/providers";
import {
  ApiError,
  createWorkspaceItem,
  deleteWorkspaceItem,
  getWorkspaceItems,
  type WorkspaceItem,
  type WorkspaceItemPayload,
  updateWorkspaceItem,
} from "@/lib/api-client";
import { getWorkspaceMetrics } from "@/lib/workspace-metrics";
import { AiSummaryCard } from "@/components/ai-summary-card";
import { ErrorBoundary } from "@/components/error-boundary";

const tokenKey = "prodesk_auth_token";
const emptyForm: WorkspaceItemPayload = {
  title: "",
  description: "",
  status: "planned",
  priority: "medium",
  dueDate: null,
};

// Code split heavy Recharts visualization suite
const DynamicWorkspaceCharts = dynamic(() => import("@/components/workspace-charts"), {
  ssr: false,
  loading: () => (
    <div aria-busy="true" aria-label="Loading charts" className="visual-grid">
      <div className="skeleton skeleton-chart-panel" />
      <div className="skeleton skeleton-chart-panel" />
    </div>
  ),
});

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function ItemForm({
  initialValue,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  initialValue: WorkspaceItemPayload;
  isSubmitting: boolean;
  onCancel?: () => void;
  onSubmit: (payload: WorkspaceItemPayload) => Promise<void>;
}) {
  const [form, setForm] = useState(initialValue);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    if (!form.title.trim()) {
      setError("Please provide a title for this item.");
      return;
    }
    setError("");
    await onSubmit({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate || null,
    });
  }

  return (
    <form className="item-form" noValidate onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="field-wide">
          <label htmlFor="item-title">Title</label>
          <input
            autoFocus
            disabled={isSubmitting}
            id="item-title"
            maxLength={120}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="e.g. Conduct user feedback interviews"
            required
            value={form.title}
          />
        </div>
        <div>
          <label htmlFor="item-status">Status</label>
          <select
            disabled={isSubmitting}
            id="item-status"
            onChange={(event) =>
              setForm({ ...form, status: event.target.value as WorkspaceItem["status"] })
            }
            value={form.status}
          >
            <option value="planned">Planned</option>
            <option value="in-progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label htmlFor="item-priority">Priority</label>
          <select
            disabled={isSubmitting}
            id="item-priority"
            onChange={(event) =>
              setForm({ ...form, priority: event.target.value as WorkspaceItem["priority"] })
            }
            value={form.priority}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label htmlFor="item-due-date">Due date</label>
          <input
            disabled={isSubmitting}
            id="item-due-date"
            onChange={(event) => setForm({ ...form, dueDate: event.target.value || null })}
            type="date"
            value={form.dueDate ? form.dueDate.slice(0, 10) : ""}
          />
        </div>
        <div className="field-wide">
          <label htmlFor="item-description">Description</label>
          <textarea
            disabled={isSubmitting}
            id="item-description"
            maxLength={500}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Add operational details, blockers, or acceptance criteria…"
            rows={3}
            value={form.description}
          />
        </div>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button
          aria-busy={isSubmitting}
          className="button-primary"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <span className="spinner spinner-small" />
              <span>Saving…</span>
            </>
          ) : (
            "Save item"
          )}
        </button>
        {onCancel && (
          <button
            className="button-secondary"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkspaceItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<WorkspaceItem | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  // Authentication guard
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  // Modal ESC key listener
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setEditingItem(null);
      setDeletingItem(null);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Fetch items
  useEffect(() => {
    if (!user) return;
    const token = window.localStorage.getItem(tokenKey);
    if (!token) return;

    let mounted = true;

    getWorkspaceItems(token)
      .then((result) => {
        if (mounted) setItems(result.items);
      })
      .catch((caughtError) => {
        if (mounted) {
          const msg =
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load your workspace items.";
          setFetchError(msg);
          toast.error(msg);
        }
      })
      .finally(() => {
        if (mounted) setIsFetching(false);
      });

    return () => {
      mounted = false;
    };
  }, [user, toast]);

  const metrics = useMemo(() => getWorkspaceMetrics(items), [items]);

  const token = typeof window !== "undefined" ? window.localStorage.getItem(tokenKey) || "" : "";

  async function saveItem(payload: WorkspaceItemPayload) {
    if (!token) {
      router.replace("/login");
      return;
    }

    setIsMutating(true);
    try {
      if (editingItem) {
        const result = await updateWorkspaceItem(token, editingItem._id, payload);
        setItems((current) =>
          current.map((item) => (item._id === editingItem._id ? result.item : item)),
        );
        setEditingItem(null);
        toast.success("Workspace item updated.");
      } else {
        const result = await createWorkspaceItem(token, payload);
        setItems((current) => [result.item, ...current]);
        setIsCreating(false);
        toast.success("Workspace item created.");
      }
    } catch (caughtError) {
      const msg =
        caughtError instanceof Error ? caughtError.message : "Unable to save this item.";
      toast.error(msg);
    } finally {
      setIsMutating(false);
    }
  }

  async function confirmDelete() {
    if (!deletingItem || !token) return;
    setIsMutating(true);
    try {
      await deleteWorkspaceItem(token, deletingItem._id);
      setItems((current) => current.filter((item) => item._id !== deletingItem._id));
      setDeletingItem(null);
      toast.success("Workspace item deleted.");
    } catch (caughtError) {
      const msg =
        caughtError instanceof ApiError ? caughtError.message : "Unable to delete this item.";
      toast.error(msg);
    } finally {
      setIsMutating(false);
    }
  }

  if (isLoading || !user) {
    return (
      <section aria-busy="true" aria-label="Authenticating session" className="dashboard-shell">
        <div className="skeleton skeleton-heading" />
        <div className="metric-grid">
          <div className="skeleton skeleton-metric" />
          <div className="skeleton skeleton-metric" />
          <div className="skeleton skeleton-metric" />
          <div className="skeleton skeleton-metric" />
        </div>
      </section>
    );
  }

  return (
    <ErrorBoundary>
      <section aria-labelledby="dashboard-title" className="dashboard-shell">
        {/* Header section */}
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">Personal operations board</p>
            <h1 id="dashboard-title">Good to see you, {user.name || "there"}.</h1>
            <p className="lede">Track the work that matters and keep momentum visible.</p>
          </div>
          <button
            className="button-primary button-large"
            onClick={() => {
              setIsCreating((prev) => !prev);
              setEditingItem(null);
            }}
            type="button"
          >
            {isCreating ? "Close form" : "+ New item"}
          </button>
        </div>

        {/* Global error banner if initial fetch failed */}
        {fetchError && (
          <div className="form-error" role="alert" style={{ marginBottom: "1.5rem" }}>
            {fetchError}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="metric-grid">
          <article className="metric-card">
            <span>Total items</span>
            <strong>{isFetching ? "—" : metrics.total}</strong>
          </article>
          <article className="metric-card">
            <span>Active</span>
            <strong className="metric-active">{isFetching ? "—" : metrics.active}</strong>
          </article>
          <article className="metric-card">
            <span>Completed</span>
            <strong className="metric-completed">{isFetching ? "—" : metrics.completed}</strong>
          </article>
          <article className="metric-card">
            <span>Overdue</span>
            <strong className={metrics.overdue > 0 ? "metric-overdue" : ""}>
              {isFetching ? "—" : metrics.overdue}
            </strong>
          </article>
        </div>

        {/* Client-Side AI Assistant */}
        <AiSummaryCard
          snapshot={{
            metrics,
            items: items.map((i) => ({
              title: i.title,
              status: i.status,
              priority: i.priority,
              dueDate: i.dueDate,
            })),
          }}
          token={token}
        />

        {/* Dynamic Charts Section */}
        <DynamicWorkspaceCharts metrics={metrics} />

        {/* Items List Section */}
        <article aria-labelledby="items-panel-title" className="panel items-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Your workspace</p>
              <h2 id="items-panel-title">Items</h2>
            </div>
            <span className="item-count">{items.length} total</span>
          </div>

          {/* Inline Create Form */}
          {isCreating && (
            <div className="inline-form">
              <h3>Create workspace item</h3>
              <ItemForm
                initialValue={emptyForm}
                isSubmitting={isMutating}
                onCancel={() => setIsCreating(false)}
                onSubmit={saveItem}
              />
            </div>
          )}

          {/* Fetching / Empty / List State */}
          {isFetching ? (
            <div aria-busy="true" aria-label="Loading workspace items" className="item-list-skeleton">
              <div className="skeleton skeleton-row" />
              <div className="skeleton skeleton-row" />
              <div className="skeleton skeleton-row" />
            </div>
          ) : items.length === 0 && !isCreating ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg
                  aria-hidden="true"
                  fill="none"
                  height="36"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                  width="36"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" x2="8" y1="13" y2="13" />
                  <line x1="16" x2="8" y1="17" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3>Your board is clear</h3>
              <p>Create your first workspace item to begin tracking progress and momentum.</p>
              <button
                className="button-primary"
                onClick={() => setIsCreating(true)}
                type="button"
              >
                + Create first item
              </button>
            </div>
          ) : (
            <div className="item-list">
              {items.map((item) => (
                <article className="item-row" key={item._id}>
                  <div className="item-copy">
                    <div className="item-topline">
                      <h3>{item.title}</h3>
                      <span className={`badge badge-${item.status}`}>
                        {item.status === "in-progress" ? "In progress" : item.status}
                      </span>
                      {item.category && (
                        <span className="category-pill">{item.category}</span>
                      )}
                    </div>
                    <p>{item.description || "No description added."}</p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="item-tags">
                        {item.tags.map((tag) => (
                          <span className="item-tag" key={tag}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <small>
                      <span className={`priority-tag priority-${item.priority}`}>
                        {item.priority}
                      </span>
                      {" · "}
                      {formatDate(item.dueDate)}
                    </small>
                  </div>
                  <div className="item-actions">
                    <button
                      className="button-secondary"
                      onClick={() => {
                        setEditingItem(item);
                        setIsCreating(false);
                      }}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="button-danger"
                      onClick={() => setDeletingItem(item)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        {/* Edit Modal */}
        {editingItem && (
          <div
            className="modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setEditingItem(null);
            }}
          >
            <div
              aria-labelledby="edit-title"
              aria-modal="true"
              className="modal"
              role="dialog"
            >
              <div className="modal-header">
                <h2 id="edit-title">Edit workspace item</h2>
                <button
                  aria-label="Close modal"
                  className="modal-close-button"
                  onClick={() => setEditingItem(null)}
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="18"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="18"
                  >
                    <line x1="18" x2="6" y1="6" y2="18" />
                    <line x1="6" x2="18" y1="6" y2="18" />
                  </svg>
                </button>
              </div>
              <ItemForm
                initialValue={{
                  title: editingItem.title,
                  description: editingItem.description,
                  status: editingItem.status,
                  priority: editingItem.priority,
                  dueDate: editingItem.dueDate,
                }}
                isSubmitting={isMutating}
                onCancel={() => setEditingItem(null)}
                onSubmit={saveItem}
              />
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingItem && (
          <div
            className="modal-backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeletingItem(null);
            }}
          >
            <div
              aria-labelledby="delete-title"
              aria-modal="true"
              className="modal confirm-modal"
              role="dialog"
            >
              <p className="eyebrow">Destructive action</p>
              <h2 id="delete-title">Delete “{deletingItem.title}”?</h2>
              <p>
                This permanently removes the item from your workspace. This action cannot be
                undone.
              </p>
              <div className="form-actions">
                <button
                  aria-busy={isMutating}
                  className="button-danger-solid"
                  disabled={isMutating}
                  onClick={confirmDelete}
                  type="button"
                >
                  {isMutating ? (
                    <>
                      <span className="spinner spinner-small" />
                      <span>Deleting…</span>
                    </>
                  ) : (
                    "Confirm delete"
                  )}
                </button>
                <button
                  className="button-secondary"
                  disabled={isMutating}
                  onClick={() => setDeletingItem(null)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </ErrorBoundary>
  );
}
