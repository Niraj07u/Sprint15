import Link from "next/link";

export default function NotFound() {
  return (
    <section aria-labelledby="not-found-title" className="auth-page">
      <div className="auth-card not-found-card">
        <p className="eyebrow">404 Error</p>
        <h1 id="not-found-title">Page not found</h1>
        <p className="lede">
          The page you are looking for does not exist, was removed, or is temporarily unavailable.
        </p>
        <div className="form-actions">
          <Link className="button-primary" href="/dashboard">
            Go to Dashboard
          </Link>
          <Link className="button-secondary" href="/login">
            Go to Login
          </Link>
        </div>
      </div>
    </section>
  );
}
