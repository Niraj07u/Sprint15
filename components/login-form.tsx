"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/app/providers";
import { authenticate } from "@/lib/api-client";

export function LoginForm() {
  const router = useRouter();
  const { establishSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const result = await authenticate("/api/auth/login", { email, password });
      establishSession(result);
      router.replace("/dashboard");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "We could not sign you in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="login-email">Email</label>
        <input autoComplete="email" id="login-email" name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
      </div>
      <div>
        <label htmlFor="login-password">Password</label>
        <input autoComplete="current-password" id="login-password" minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button disabled={isSubmitting} type="submit">{isSubmitting ? "Signing in…" : "Sign in"}</button>
      <p className="form-footer">New to Prodesk? <Link href="/register">Create an account</Link></p>
    </form>
  );
}
