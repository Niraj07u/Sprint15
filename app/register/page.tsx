import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <section className="auth-page" aria-labelledby="register-title">
      <div className="auth-card">
        <p className="eyebrow">Prodesk IT · Sprint 15</p>
        <h1 id="register-title">Create your account</h1>
        <p className="lede">Start with a secure account for your workspace.</p>
        <RegisterForm />
      </div>
    </section>
  );
}
