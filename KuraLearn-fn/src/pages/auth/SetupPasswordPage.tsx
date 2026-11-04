import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import { Shield, Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react";
import kuraLogo from "@/assets/kuraLogo.png";

export function SetupPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const expires = Number(params.get("expires") ?? 0);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isExpired] = useState(() => expires > 0 && Date.now() > expires);

  const strength = password.length >= 12 ? "strong" : password.length >= 8 ? "medium" : "weak";
  const strengthColor =
    strength === "strong" ? "bg-green-500" : strength === "medium" ? "bg-yellow-500" : "bg-red-400";
  const strengthWidth =
    strength === "strong"
      ? "w-full"
      : strength === "medium"
        ? "w-2/3"
        : password.length > 0
          ? "w-1/3"
          : "w-0";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Invalid setup link. Please ask your administrator to resend the invitation.");
      return;
    }

    setLoading(true);
    try {
      await apiRequest<{ success: boolean }>("/staff/setup-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f0f4ff] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-10 text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Set!</h2>
          <p className="text-sm font-semibold text-slate-500 mb-8">
            Your account is now active. You can log in to the KuraLearn portal.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#f0f4ff] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-10 text-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Link Expired</h2>
          <p className="text-sm font-semibold text-slate-500 mb-2">
            This setup link has expired (valid for 48 hours). Please contact your school
            administrator to resend the invitation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4ff] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <img src={kuraLogo} alt="KuraLearn" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-[#0b1f4d]">KuraLearn</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-lg p-8">
          <div className="mb-6 text-center">
            <div className="h-14 w-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-7 w-7 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Set Up Your Password</h2>
            <p className="text-sm font-semibold text-slate-500 mt-1">
              Create a secure password to activate your staff account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                New Password
              </label>
              <div className="relative">
                <input
                  id="setup-password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm font-semibold focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthColor} ${strengthWidth}`}
                    />
                  </div>
                  <p
                    className={`text-xs font-bold mt-1 ${strength === "strong" ? "text-green-600" : strength === "medium" ? "text-yellow-600" : "text-red-600"}`}
                  >
                    {strength === "strong"
                      ? "Strong password"
                      : strength === "medium"
                        ? "Moderate password"
                        : "Weak password"}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                Confirm Password
              </label>
              <input
                id="setup-password-confirm"
                type={showPwd ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200"
              />
              {confirm.length > 0 && password !== confirm && (
                <p className="text-xs font-bold text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              id="setup-password-submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 shadow-md"
            >
              {loading ? "Setting up account…" : "Set Password & Activate Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs font-semibold text-slate-500 mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-600 hover:text-indigo-800">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
