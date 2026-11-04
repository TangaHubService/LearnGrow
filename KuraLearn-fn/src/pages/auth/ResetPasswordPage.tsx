import { type FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthCard, authButtonClass, AuthError, authInputClass } from "@/components/auth/AuthCard";
import { authApi } from "@/lib/api";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthCard title="This link is not complete">
        <p className="text-sm text-slate-700">
          Open the full link from your email, or{" "}
          <Link to="/forgot-password" className="font-bold text-[#5b2fd6] underline">
            ask for a new one
          </Link>
          .
        </p>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title="Password changed">
        <p role="status" className="mb-5 text-sm text-slate-700">
          You can now sign in with your new password.
        </p>
        <Link to="/login" className={authButtonClass}>
          Go to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" subtitle="Use at least 8 characters.">
      <form onSubmit={submit} className="space-y-4">
        <AuthError message={error} />
        {error?.includes("expired") ? (
          <Link to="/forgot-password" className="block text-sm font-bold text-[#5b2fd6] underline">
            Ask for a new link
          </Link>
        ) : null}
        <label className="block text-sm font-semibold text-slate-700">
          New password
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={authInputClass}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Confirm new password
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className={authInputClass}
          />
        </label>
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? "Saving..." : "Save new password"}
        </button>
      </form>
    </AuthCard>
  );
}
