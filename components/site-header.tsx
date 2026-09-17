"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/providers";

export function SiteHeader() {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="site-header">
      <Link className="brand" href={isAuthenticated ? "/dashboard" : "/login"}>Prodesk</Link>
      <nav aria-label="Main navigation">
        {isAuthenticated ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <button className="link-button" onClick={handleLogout} type="button">
              Logout
            </button>
          </>
        ) : !isLoading ? (
          <>
            <Link href="/login">Login</Link>
            <Link className="nav-accent" href="/register">Register</Link>
          </>
        ) : null}
      </nav>
    </header>
  );
}
