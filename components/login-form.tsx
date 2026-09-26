"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth, useToast } from "@/app/providers";
import { authenticate } from "@/lib/api-client";

export function LoginForm() {
  const router = useRouter();
  const { establishSession } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const result = await authenticate("/api/auth/login", { email, password });
      establishSession(result);
      toast.success("Signed in successfully!");
      router.replace("/dashboard");
    } catch (caughtError) {
      const msg = caughtError instanceof Error ? caughtError.message : "We could not sign you in. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" noValidate onSubmit={handleSubmit}>
      <div>
        <label htmlFor="login-email">Email address</label>
        <input
          autoComplete="email"
          disabled={isSubmitting}
          id="login-email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          required
          type="email"
          value={email}
        />
      </div>
      <div>
        <label htmlFor="login-password">Password</label>
        <input
          autoComplete="current-password"
          disabled={isSubmitting}
          id="login-password"
          minLength={8}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
          type="password"
          value={password}
        />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button aria-busy={isSubmitting} className="button-primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          <>
            <span className="spinner spinner-small" />
            <span>Signing in…</span>
          </>
        ) : (
          "Sign in"
        )}
      </button>
      <p className="form-footer">
        New to Prodesk? <Link href="/register">Create an account</Link>
      </p>
    </form>
  );
}
