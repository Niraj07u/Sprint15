"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth, useToast } from "@/app/providers";
import { authenticate } from "@/lib/api-client";

export function RegisterForm() {
  const router = useRouter();
  const { establishSession } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setError("");
    if (name.trim().length < 2) return setError("Enter a name with at least 2 characters.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setIsSubmitting(true);
    try {
      const result = await authenticate("/api/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      establishSession(result);
      toast.success("Account created successfully!");
      router.replace("/dashboard");
    } catch (caughtError) {
      const msg =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create your account. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" noValidate onSubmit={handleSubmit}>
      <div>
        <label htmlFor="register-name">Full name</label>
        <input
          autoComplete="name"
          disabled={isSubmitting}
          id="register-name"
          maxLength={80}
          name="name"
          onChange={(event) => setName(event.target.value)}
          placeholder="Jane Doe"
          required
          value={name}
        />
      </div>
      <div>
        <label htmlFor="register-email">Email address</label>
        <input
          autoComplete="email"
          disabled={isSubmitting}
          id="register-email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="jane@example.com"
          required
          type="email"
          value={email}
        />
      </div>
      <div>
        <label htmlFor="register-password">Password</label>
        <input
          aria-describedby="password-help"
          autoComplete="new-password"
          disabled={isSubmitting}
          id="register-password"
          minLength={8}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
          type="password"
          value={password}
        />
        <small id="password-help">Minimum 8 characters.</small>
      </div>
      <div>
        <label htmlFor="register-confirm-password">Confirm password</label>
        <input
          autoComplete="new-password"
          disabled={isSubmitting}
          id="register-confirm-password"
          minLength={8}
          name="confirmPassword"
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="••••••••"
          required
          type="password"
          value={confirmPassword}
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
            <span>Creating account…</span>
          </>
        ) : (
          "Create account"
        )}
      </button>
      <p className="form-footer">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
