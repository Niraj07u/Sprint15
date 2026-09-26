"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth, useToast } from "@/app/providers";

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const { toast } = useToast();

  function handleLogout() {
    logout();
    toast.info("Logged out successfully.");
    router.replace("/login");
  }

  return (
    <header className="site-header">
      <Link className="brand" href={isAuthenticated ? "/dashboard" : "/login"}>
        <span className="brand-icon">
          <svg
            aria-hidden="true"
            fill="none"
            height="18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            width="18"
          >
            <rect height="18" rx="2" width="18" x="3" y="3" />
            <path d="M9 3v18" />
            <path d="M14 9h7" />
            <path d="M14 15h7" />
          </svg>
        </span>
        <span className="brand-text">Prodesk</span>
      </Link>

      <nav aria-label="Main navigation">
        {isAuthenticated ? (
          <>
            <Link
              aria-current={pathname === "/dashboard" ? "page" : undefined}
              className={`nav-link ${pathname === "/dashboard" ? "active" : ""}`}
              href="/dashboard"
            >
              Dashboard
            </Link>
            {user && (
              <span className="user-badge" title={user.email}>
                {user.name}
              </span>
            )}
            <button className="link-button logout-button" onClick={handleLogout} type="button">
              Logout
            </button>
          </>
        ) : !isLoading ? (
          <>
            <Link
              aria-current={pathname === "/login" ? "page" : undefined}
              className={`nav-link ${pathname === "/login" ? "active" : ""}`}
              href="/login"
            >
              Sign in
            </Link>
            <Link className="nav-accent" href="/register">
              Get started
            </Link>
          </>
        ) : null}
      </nav>
    </header>
  );
}
