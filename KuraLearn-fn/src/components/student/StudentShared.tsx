import { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Calculator,
  ChevronRight,
  Flame,
  Footprints,
  Globe,
  Languages,
  Monitor,
  Paintbrush,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { ProgressBar as CommonProgressBar } from "@/components/common/ProgressBar";

export const iconMap = {
  calculator: Calculator,
  "book-open": BookOpen,
  languages: Languages,
  globe: Globe,
  paintbrush: Paintbrush,
  monitor: Monitor,
  footprints: Footprints,
  "shield-check": ShieldCheck,
  star: Star,
  flame: Flame,
};

export type IconName = keyof typeof iconMap;

export function StudentIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const Component = (iconMap as any)[name] ?? Sparkles;
  return <Component className={className} />;
}

export function StudentCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

export function StudentProgressBar({
  value,
  color = "#059669",
}: {
  value: number;
  color?: string;
}) {
  return <CommonProgressBar value={value} color={color} />;
}

export function PrimaryLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 transition-colors"
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({
  to,
  children,
  target,
}: {
  to: string;
  children: ReactNode;
  target?: string;
}) {
  return (
    <Link
      to={to}
      target={target}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
    >
      {children}
    </Link>
  );
}

export function StudentEmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <StudentCard className="py-8 text-center">
      <p className="text-lg font-bold text-slate-900">{title}</p>
      <p className="mt-1 text-sm font-medium text-slate-500">{message}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </StudentCard>
  );
}

export function StudentStat({
  label,
  value,
  icon: IconComponent,
  tone,
}: {
  label: string;
  value: string | number;
  icon: any;
  tone: string;
}) {
  return <DashboardStatCard label={label} value={value} icon={IconComponent} tone={tone} />;
}
