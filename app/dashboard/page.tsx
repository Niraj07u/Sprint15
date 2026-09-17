"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useAuth } from "@/app/providers";
import { ApiError, createWorkspaceItem, deleteWorkspaceItem, getWorkspaceItems, type WorkspaceItem, type WorkspaceItemPayload, updateWorkspaceItem } from "@/lib/api-client";
import { getWorkspaceMetrics } from "@/lib/workspace-metrics";

const tokenKey = "prodesk_auth_token";
const emptyForm: WorkspaceItemPayload = { title: "", description: "", status: "planned", priority: "medium", dueDate: null };
const chartColors = ["#d06b35", "#285943", "#234e70"];

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function ItemForm({ initialValue, isSubmitting, onCancel, onSubmit }: { initialValue: WorkspaceItemPayload; isSubmitting: boolean; onCancel?: () => void; onSubmit: (payload: WorkspaceItemPayload) => Promise<void> }) {
  const [form, setForm] = useState(initialValue);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) return setError("Add a title before saving.");
    setError("");
    await onSubmit({ ...form, title: form.title.trim(), description: form.description.trim(), dueDate: form.dueDate || null });
  }

  return <form className="item-form" onSubmit={handleSubmit} noValidate><div className="form-grid"><div className="field-wide"><label htmlFor="item-title">Title</label><input id="item-title" maxLength={120} onChange={(event) => setForm({ ...form, title: event.target.value })} required value={form.title} /></div><div><label htmlFor="item-status">Status</label><select id="item-status" onChange={(event) => setForm({ ...form, status: event.target.value as WorkspaceItem["status"] })} value={form.status}><option value="planned">Planned</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></div><div><label htmlFor="item-priority">Priority</label><select id="item-priority" onChange={(event) => setForm({ ...form, priority: event.target.value as WorkspaceItem["priority"] })} value={form.priority}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div><div><label htmlFor="item-due-date">Due date</label><input id="item-due-date" onChange={(event) => setForm({ ...form, dueDate: event.target.value || null })} type="date" value={form.dueDate ? form.dueDate.slice(0, 10) : ""} /></div><div className="field-wide"><label htmlFor="item-description">Description</label><textarea id="item-description" maxLength={500} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} value={form.description} /></div></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button disabled={isSubmitting} type="submit">{isSubmitting ? "Saving…" : "Save item"}</button>{onCancel && <button className="button-secondary" disabled={isSubmitting} onClick={onCancel} type="button">Cancel</button>}</div></form>;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkspaceItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<WorkspaceItem | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => { if (!isLoading && !user) router.replace("/login"); }, [isLoading, router, user]);
  useEffect(() => {
    if (!user) return;
    const token = window.localStorage.getItem(tokenKey);
    if (!token) return;
    getWorkspaceItems(token).then((result) => setItems(result.items)).catch((caughtError) => setError(caughtError instanceof Error ? caughtError.message : "Unable to load your workspace items.")).finally(() => setIsFetching(false));
  }, [user]);

  if (isLoading || !user) return <section className="dashboard-shell"><p>Verifying your session…</p></section>;
  const metrics = getWorkspaceMetrics(items);

  async function saveItem(payload: WorkspaceItemPayload) {
    const token = window.localStorage.getItem(tokenKey);
    if (!token) return router.replace("/login");
    setIsMutating(true); setError("");
    try { if (editingItem) { const result = await updateWorkspaceItem(token, editingItem._id, payload); setItems((current) => current.map((item) => item._id === editingItem._id ? result.item : item)); setEditingItem(null); setNotice("Workspace item updated."); } else { const result = await createWorkspaceItem(token, payload); setItems((current) => [result.item, ...current]); setIsCreating(false); setNotice("Workspace item created."); } }
    catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : "Unable to save this item."); }
    finally { setIsMutating(false); }
  }

  async function confirmDelete() {
    if (!deletingItem) return;
    const token = window.localStorage.getItem(tokenKey);
    if (!token) return router.replace("/login");
    setIsMutating(true); setError("");
    try { await deleteWorkspaceItem(token, deletingItem._id); setItems((current) => current.filter((item) => item._id !== deletingItem._id)); setDeletingItem(null); setNotice("Workspace item deleted."); } catch (caughtError) { setError(caughtError instanceof ApiError ? caughtError.message : "Unable to delete this item."); } finally { setIsMutating(false); }
  }

  return <section className="dashboard-shell" aria-labelledby="dashboard-title"><div className="dashboard-heading"><div><p className="eyebrow">Personal operations board</p><h1 id="dashboard-title">Good to see you, {user.name || "there"}.</h1><p className="lede">Track the work that matters and keep momentum visible.</p></div><button onClick={() => { setIsCreating(true); setEditingItem(null); setNotice(""); }} type="button">+ New item</button></div>{notice && <p className="success-message" role="status">{notice}</p>}{error && <p className="form-error" role="alert">{error}</p>}<div className="metric-grid"><article><span>Total items</span><strong>{metrics.total}</strong></article><article><span>Active</span><strong>{metrics.active}</strong></article><article><span>Completed</span><strong>{metrics.completed}</strong></article><article><span>Overdue</span><strong>{metrics.overdue}</strong></article></div><div className="visual-grid"><article className="panel chart-panel"><div className="panel-heading"><div><p className="eyebrow">Status mix</p><h2>Progress at a glance</h2></div></div><div className="chart"><ResponsiveContainer height={240} width="100%"><BarChart data={metrics.byStatus}><CartesianGrid stroke="#d9dfd7" vertical={false} /><XAxis axisLine={false} dataKey="name" tick={{ fill: "#506057", fontSize: 12 }} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tick={{ fill: "#506057", fontSize: 12 }} tickLine={false} /><Tooltip /><Bar dataKey="value" fill="#d06b35" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></article><article className="panel chart-panel"><div className="panel-heading"><div><p className="eyebrow">Priority mix</p><h2>Where attention goes</h2></div></div><div className="chart"><ResponsiveContainer height={240} width="100%"><PieChart><Pie data={metrics.byPriority} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={3}>{metrics.byPriority.map((entry, index) => <Cell fill={chartColors[index]} key={entry.name} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></article></div><article className="panel items-panel"><div className="panel-heading"><div><p className="eyebrow">Your workspace</p><h2>Items</h2></div><span className="item-count">{items.length} total</span></div>{isCreating && <div className="inline-form"><h3>Create workspace item</h3><ItemForm initialValue={emptyForm} isSubmitting={isMutating} onCancel={() => setIsCreating(false)} onSubmit={saveItem} /></div>}{isFetching ? <p className="empty-state">Loading your workspace…</p> : items.length === 0 && !isCreating ? <div className="empty-state"><h3>Your board is clear.</h3><p>Create your first workspace item to start building a useful rhythm.</p><button onClick={() => setIsCreating(true)} type="button">Create first item</button></div> : <div className="item-list">{items.map((item) => <article className="item-row" key={item._id}><div className="item-copy"><div className="item-topline"><h3>{item.title}</h3><span className={`badge badge-${item.status}`}>{item.status === "in-progress" ? "In progress" : item.status}</span></div><p>{item.description || "No description added."}</p><small>{item.priority} priority · {formatDate(item.dueDate)}</small></div><div className="item-actions"><button className="button-secondary" onClick={() => { setEditingItem(item); setIsCreating(false); }} type="button">Edit</button><button className="button-danger" onClick={() => setDeletingItem(item)} type="button">Delete</button></div></article>)}</div>}</article>{editingItem && <div className="modal-backdrop"><div aria-labelledby="edit-title" aria-modal="true" className="modal" role="dialog"><h2 id="edit-title">Edit workspace item</h2><ItemForm initialValue={{ title: editingItem.title, description: editingItem.description, status: editingItem.status, priority: editingItem.priority, dueDate: editingItem.dueDate }} isSubmitting={isMutating} onCancel={() => setEditingItem(null)} onSubmit={saveItem} /></div></div>}{deletingItem && <div className="modal-backdrop"><div aria-labelledby="delete-title" aria-modal="true" className="modal confirm-modal" role="dialog"><p className="eyebrow">Destructive action</p><h2 id="delete-title">Delete “{deletingItem.title}”?</h2><p>This permanently removes the item from your workspace. This cannot be undone.</p><div className="form-actions"><button className="button-danger-solid" disabled={isMutating} onClick={confirmDelete} type="button">{isMutating ? "Deleting…" : "Confirm delete"}</button><button className="button-secondary" disabled={isMutating} onClick={() => setDeletingItem(null)} type="button">Cancel</button></div></div></div>}</section>;
}
