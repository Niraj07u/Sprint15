"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import Link from "next/link";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <section aria-labelledby="error-boundary-title" className="error-fallback-card">
          <div className="error-fallback-icon">
            <svg
              aria-hidden="true"
              fill="none"
              height="28"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="28"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <h2 id="error-boundary-title">Something went wrong</h2>
          <p className="error-fallback-message">
            An unexpected error occurred while rendering this section. You can try refreshing or returning to the dashboard.
          </p>
          <div className="error-fallback-actions">
            <button className="button-primary" onClick={this.handleReset} type="button">
              Try again
            </button>
            <Link className="button-secondary" href="/dashboard">
              Return to dashboard
            </Link>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
