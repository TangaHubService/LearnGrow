import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthCard, authButtonClass, AuthError, authInputClass } from "@/components/auth/AuthCard";
import { useAuth } from "@/contexts/AuthContext";

export function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STUDENT" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim() });
      navigate("/", { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="For students and parents. Staff accounts are created by the school."
      backTo="/welcome"
      backLabel="Back to home"
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthError message={error} />
        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">I am a</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              { value: "STUDENT", label: "Student" },
              { value: "PARENT", label: "Parent" },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-bold ${
                  form.role === option.value
                    ? "border-[#6d3eeb] bg-purple-50 text-[#5b2fd6]"
                    : "border-slate-300 text-slate-700"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={form.role === option.value}
                  onChange={() => set("role", option.value)}
                  className="accent-[#6d3eeb]"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm font-semibold text-slate-700">
          Full name
          <input
            required
            minLength={2}
            autoComplete="name"
            value={form.name}
            onChange={(event) => set("name", event.target.value)}
            className={authInputClass}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(event) => set("email", event.target.value)}
            className={authInputClass}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Password
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            aria-describedby="register-password-hint"
            value={form.password}
            onChange={(event) => set("password", event.target.value)}
            className={authInputClass}
          />
          <span
            id="register-password-hint"
            className="mt-1 block text-xs font-normal text-slate-600"
          >
            At least 8 characters.
          </span>
        </label>
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-bold text-[#5b2fd6] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
