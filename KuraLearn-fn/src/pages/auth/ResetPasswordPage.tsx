import { type FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthCard, authButtonClass, AuthError, authInputClass } from "@/components/auth/AuthCard";
import { authApi } from "@/lib/api";
import { useT } from "@/i18n/I18nContext";

export function ResetPasswordPage() {
  const t = useT();
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
      <AuthCard title={t("This link is not complete")}>
        <p className="text-sm text-slate-700">
          {t("Open the full link from your email.")}{" "}
          <Link to="/forgot-password" className="font-bold text-[#5b2fd6] underline">
            {t("Ask for a new link")}
          </Link>
        </p>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title={t("Password changed")}>
        <p role="status" className="mb-5 text-sm text-slate-700">
          {t("You can now sign in with your new password.")}
        </p>
        <Link to="/login" className={authButtonClass}>
          {t("Go to sign in")}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("Choose a new password")} subtitle={t("Use at least 8 characters.")}>
      <form onSubmit={submit} className="space-y-4">
        <AuthError message={error} />
        {error?.includes("expired") ? (
          <Link to="/forgot-password" className="block text-sm font-bold text-[#5b2fd6] underline">
            {t("Ask for a new link")}
          </Link>
        ) : null}
        <label className="block text-sm font-semibold text-slate-700">
          {t("New password")}
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
          {t("Confirm new password")}
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
          {loading ? t("Saving...") : t("Save new password")}
        </button>
      </form>
    </AuthCard>
  );
}
