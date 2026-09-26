"use client";

import { useToast, type ToastItem } from "./toast-context";

function ToastIcon({ type }: { type: ToastItem["type"] }) {
  if (type === "success") {
    return (
      <svg
        aria-hidden="true"
        className="toast-icon toast-icon-success"
        fill="none"
        height="20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="20"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    );
  }

  if (type === "error") {
    return (
      <svg
        aria-hidden="true"
        className="toast-icon toast-icon-error"
        fill="none"
        height="20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="20"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" x2="9" y1="9" y2="15" />
        <line x1="9" x2="15" y1="9" y2="15" />
      </svg>
    );
  }

  if (type === "warning") {
    return (
      <svg
        aria-hidden="true"
        className="toast-icon toast-icon-warning"
        fill="none"
        height="20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="20"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" x2="12" y1="9" y2="13" />
        <line x1="12" x2="12.01" y1="17" y2="17" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="toast-icon toast-icon-info"
      fill="none"
      height="20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="20"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="16" y2="12" />
      <line x1="12" x2="12.01" y1="8" y2="8" />
    </svg>
  );
}

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      aria-live="polite"
      className="toast-container"
      role="region"
    >
      {toasts.map((toast) => (
        <div
          className={`toast-item toast-${toast.type}`}
          key={toast.id}
          role={toast.type === "error" ? "alert" : "status"}
        >
          <ToastIcon type={toast.type} />
          <p className="toast-message">{toast.message}</p>
          <button
            aria-label="Dismiss notification"
            className="toast-dismiss-button"
            onClick={() => dismissToast(toast.id)}
            type="button"
          >
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
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </aside>
  );
}
