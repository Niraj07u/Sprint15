import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <section className="auth-page" aria-labelledby="login-title">
      <div className="auth-card">
        <p className="eyebrow">Prodesk IT · Sprint 15</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="lede">Sign in to access your protected workspace.</p>
        <LoginForm />
      </div>
    </section>
  );
}
