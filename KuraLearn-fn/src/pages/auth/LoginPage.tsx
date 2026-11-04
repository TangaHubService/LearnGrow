import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LogIn,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Users,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BrandLogo } from "@/components/common/BrandLogo";
import educationIllustration from "@/assets/education_illustration.png";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      // In a real app, you might handle rememberMe here with localStorage/cookies
      // The root route sends each account to the home page for its role.
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Check your details and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side: Login Form */}
      <section className="flex w-full flex-col justify-center p-8 sm:p-12 lg:w-[500px] xl:w-[600px]">
        <div className="mx-auto w-full max-w-md">
          <Link
            to="/welcome"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-[#5b2fd6]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to home
          </Link>
          {/* Branding */}
          <Link to="/welcome" className="mb-10 flex items-center gap-3">
            <BrandLogo />
            <div>
              <p className="text-xl font-bold tracking-tight text-slate-900">KuraLearn</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Inclusive Digital Education
              </p>
            </div>
          </Link>

          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900">Welcome back</h1>
            <p className="mt-2 text-slate-500">Sign in with your school email and password.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600 animate-in fade-in slide-in-from-top-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700" htmlFor="email">
                Email or Username
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-medium outline-none transition-all focus:border-[#6d3eeb] focus:bg-white focus:ring-4 focus:ring-purple-100"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700" htmlFor="password">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  title="Forgot password"
                  className="text-xs font-bold text-[#6d3eeb] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 font-medium outline-none transition-all focus:border-[#6d3eeb] focus:bg-white focus:ring-4 focus:ring-purple-100"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex cursor-pointer items-center gap-2 group">
                <div className="relative flex h-5 w-5 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-200 transition-all checked:border-[#6d3eeb] checked:bg-[#6d3eeb]"
                  />
                  <CheckCircle2
                    size={14}
                    className="pointer-events-none absolute text-white opacity-0 transition-opacity peer-checked:opacity-100"
                  />
                </div>
                <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                  Remember me
                </span>
              </label>
            </div>

            <button
              disabled={loading}
              className="relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#6d3eeb] px-6 font-bold text-white shadow-lg transition-all hover:bg-[#5b31cb] active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <LogIn size={18} />
                </>
              )}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            New to KuraLearn?{" "}
            <Link to="/register" className="font-bold text-[#5b2fd6] hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-auto pt-8 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">
          © 2024 KuraLearn • Inclusive Digital Education
        </div>
      </section>

      {/* Right Side: Illustration & Features */}
      <section className="hidden flex-1 relative bg-slate-50 lg:flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={educationIllustration}
            alt="Education Illustration"
            className="h-full w-full object-cover opacity-90"
          />
        </div>

        {/* Floating Feature Cards */}
        <div className="relative z-10 w-full max-w-2xl px-12 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FeatureCard
              icon={<Zap className="text-yellow-500" />}
              title="Lesson planning"
              desc="Prepare lessons and share them with your classes."
            />
            <FeatureCard
              icon={<CheckCircle2 className="text-emerald-700" />}
              title="Attendance tracking"
              desc="Mark attendance and keep parents informed."
            />
            <FeatureCard
              icon={<Users className="text-blue-600" />}
              title="Parent monitoring"
              desc="Stay updated on your child's daily progress."
            />
            <FeatureCard
              icon={<GraduationCap className="text-purple-700" />}
              title="Workload reduction"
              desc="Less paperwork, more time for teaching."
            />
          </div>

          <div className="rounded-2xl bg-white/95 p-8 border border-white/50 shadow-lg">
            <h3 className="text-2xl font-bold text-slate-900 leading-tight">
              Your school, <br /> all in one place.
            </h3>
            <p className="mt-3 text-slate-700 font-medium leading-relaxed">
              Students, teachers and parents can follow lessons, attendance and marks from one
              account.
            </p>
            <div className="mt-6 flex gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-white bg-slate-200"
                  />
                ))}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#6d3eeb] text-[10px] font-bold text-white">
                  +2k
                </div>
              </div>
              <p className="text-xs font-bold self-center text-slate-500">
                Trusted by 2,000+ schools nationwide
              </p>
            </div>
          </div>
        </div>

        {/* Abstract Shapes */}
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl bg-white/95 p-4 border border-white/40 shadow-sm transition-all hover:scale-[1.02] hover:bg-white/80 group">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      <p className="mt-1 text-[11px] leading-normal font-medium text-slate-500">{desc}</p>
    </div>
  );
}
