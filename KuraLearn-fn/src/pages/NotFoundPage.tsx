import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, LogIn } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";

export function NotFoundPage() {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] px-6 py-12 text-center">
      <Link to="/" className="mb-10 flex items-center gap-3">
        <BrandLogo />
        <span className="text-xl font-bold tracking-tight text-slate-900">KuraLearn</span>
      </Link>

      <p className="font-display text-7xl font-bold text-[#6d3eeb] sm:text-8xl">404</p>
      <h1 className="mt-4 text-3xl font-extrabold text-slate-900">Page not found</h1>
      <p className="mt-3 max-w-md text-slate-500">
        We couldn't find{" "}
        <code className="break-all text-sm font-semibold text-slate-700">{pathname}</code>. It may
        have moved, or the link may be wrong.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#6d3eeb] px-6 font-bold text-white shadow-lg transition-colors hover:bg-[#5b31cb]"
        >
          <ArrowLeft size={18} />
          {isAuthenticated ? "Back to my dashboard" : "Back to home"}
        </Link>
        {!isAuthenticated ? (
          <Link
            to="/login"
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <LogIn size={18} />
            Sign in
          </Link>
        ) : null}
      </div>
    </main>
  );
}
