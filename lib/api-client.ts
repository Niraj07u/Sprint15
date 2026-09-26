"use client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  success: true;
  message: string;
  token: string;
  user: AuthUser;
};

export type WorkspaceItem = {
  _id: string;
  userId: string;
  title: string;
  description: string;
  status: "planned" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  category?: string;
  tags?: string[];
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceItemPayload = Omit<WorkspaceItem, "_id" | "userId" | "createdAt" | "updatedAt">;

type ApiErrorPayload = { message?: string };

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & ApiErrorPayload;
  if (!response.ok) {
    throw new ApiError(payload.message || "The request could not be completed.", response.status);
  }
  return payload;
}

export async function authenticate(path: "/api/auth/register" | "/api/auth/login", body: Record<string, string>) {
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return parseResponse<AuthResponse>(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Unable to reach the authentication service. Please try again.", 0);
  }
}

export async function getCurrentUser(token: string) {
  try {
    const response = await fetch(`${apiUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return parseResponse<{ success: true; user: AuthUser }>(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Unable to verify your session.", 0);
  }
}

async function requestWorkspaceItem<T>(token: string, path: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${apiUrl}/api/workspace-items${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
    });
    if (response.status === 204) return undefined as T;
    return parseResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Unable to reach the workspace service. Please try again.", 0);
  }
}

export async function getWorkspaceItems(token: string) {
  return requestWorkspaceItem<{ success: true; items: WorkspaceItem[] }>(token, "/");
}

export async function createWorkspaceItem(token: string, payload: WorkspaceItemPayload) {
  return requestWorkspaceItem<{ success: true; item: WorkspaceItem }>(token, "/", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateWorkspaceItem(token: string, itemId: string, payload: WorkspaceItemPayload) {
  return requestWorkspaceItem<{ success: true; item: WorkspaceItem }>(token, `/${itemId}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function deleteWorkspaceItem(token: string, itemId: string) {
  return requestWorkspaceItem<void>(token, `/${itemId}`, { method: "DELETE" });
}
