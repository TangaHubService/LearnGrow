import { type FormEvent, useState } from "react";
import { AuthCard, authButtonClass, AuthError, authInputClass } from "@/components/auth/AuthCard";
import { authApi } from "@/lib/api";
import { useT } from "@/i18n/I18nContext";

export function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(t((err as Error).message));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthCard title={t("Check your email")}>
        <p role="status" className="text-sm text-slate-700">
          {t(
            "If {email} has a KuraLearn account, we sent it a link to choose a new password. The link works once and expires in one hour.",
            { email: email.trim() },
          )}
        </p>
        <p className="mt-3 text-sm text-slate-600">
          {t("Nothing arrived? Check your spam folder or ask your school administrator for help.")}
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t("Forgot your password?")}
      subtitle={t("Enter your email and we'll send you a link to choose a new one.")}
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthError message={error} />
        <label className="block text-sm font-semibold text-slate-700">
          {t("Email")}
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={authInputClass}
          />
        </label>
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? t("Sending…") : t("Send reset link")}
        </button>
      </form>
    </AuthCard>
  );
}
