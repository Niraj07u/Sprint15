"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error caught:", error);
  }, [error]);

  return (
    <section aria-labelledby="route-error-title" className="error-page-shell">
      <div className="error-fallback-card">
        <div className="error-fallback-icon">
          <svg
            aria-hidden="true"
            fill="none"
            height="32"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="32"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" x2="12" y1="9" y2="13" />
            <line x1="12" x2="12.01" y1="17" y2="17" />
          </svg>
        </div>
        <p className="eyebrow">Application Notice</p>
        <h1 id="route-error-title">We encountered an issue</h1>
        <p className="lede">
          Something unexpected happened while loading this page. Your workspace data remains secure.
        </p>
        <div className="error-fallback-actions">
          <button className="button-primary" onClick={() => reset()} type="button">
            Try again
          </button>
          <Link className="button-secondary" href="/dashboard">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
