import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/common/BrandLogo";

/** Centered card used by the account pages that sit around sign-in. */
export function AuthCard({
  title,
  subtitle,
  children,
  backTo = "/login",
  backLabel = "Back to sign in",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  backTo?: string;
  backLabel?: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f0f4ff] p-4">
      <div className="w-full max-w-md">
        <Link to="/welcome" className="mb-8 flex items-center justify-center gap-3">
          <BrandLogo />
          <span className="text-xl font-bold text-slate-900">KuraLearn</span>
        </Link>
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
        <Link
          to={backTo}
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-bold text-[#5b2fd6] hover:underline"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {backLabel}
        </Link>
      </div>
    </main>
  );
}

export const authInputClass =
  "mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#6d3eeb] focus:ring-2 focus:ring-[#6d3eeb]/20";

export const authButtonClass =
  "flex h-11 w-full items-center justify-center rounded-xl bg-[#6d3eeb] text-sm font-bold text-white hover:bg-[#5b2fd6] disabled:opacity-60";

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
      {message}
    </p>
  );
}
