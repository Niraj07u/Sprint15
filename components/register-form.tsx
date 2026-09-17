"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/app/providers";
import { authenticate } from "@/lib/api-client";

export function RegisterForm() {
  const router = useRouter();
  const { establishSession } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Enter a name with at least 2 characters.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setIsSubmitting(true);
    try {
      const result = await authenticate("/api/auth/register", { name, email, password });
      establishSession(result);
      router.replace("/dashboard");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="register-name">Name</label>
        <input autoComplete="name" id="register-name" maxLength={80} name="name" onChange={(event) => setName(event.target.value)} required value={name} />
      </div>
      <div>
        <label htmlFor="register-email">Email</label>
        <input autoComplete="email" id="register-email" name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
      </div>
      <div>
        <label htmlFor="register-password">Password</label>
        <input aria-describedby="password-help" autoComplete="new-password" id="register-password" minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        <small id="password-help">At least 8 characters.</small>
      </div>
      <div>
        <label htmlFor="register-confirm-password">Confirm password</label>
        <input autoComplete="new-password" id="register-confirm-password" minLength={8} name="confirmPassword" onChange={(event) => setConfirmPassword(event.target.value)} required type="password" value={confirmPassword} />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button disabled={isSubmitting} type="submit">{isSubmitting ? "Creating account…" : "Create account"}</button>
      <p className="form-footer">Already have an account? <Link href="/login">Sign in</Link></p>
    </form>
  );
}
