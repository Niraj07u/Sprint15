"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
};

type ToastContextValue = {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
  };
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => {
        // Prevent duplicate consecutive toasts with identical message and type
        const existing = prev.find((t) => t.message === message && t.type === type);
        if (existing) return prev;
        return [...prev.slice(-4), { id, type, message, duration }];
      });

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast],
  );

  const toastMethods = useMemo(
    () => ({
      success: (msg: string, dur?: number) => showToast(msg, "success", dur),
      error: (msg: string, dur?: number) => showToast(msg, "error", dur ?? 5000),
      info: (msg: string, dur?: number) => showToast(msg, "info", dur),
      warning: (msg: string, dur?: number) => showToast(msg, "warning", dur),
    }),
    [showToast],
  );

  const contextValue = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast,
      toast: toastMethods,
    }),
    [toasts, showToast, dismissToast, toastMethods],
  );

  return <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
