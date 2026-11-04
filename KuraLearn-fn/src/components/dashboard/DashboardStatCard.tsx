import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type DashboardStatCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone: string;
  caption?: string;
  onClick?: () => void;
  trendLabel?: string;
  trendTone?: "good" | "bad" | "neutral";
  trendDirection?: "up" | "down" | "flat";
};

function CardInner(props: DashboardStatCardProps) {
  const { label, value, icon: Icon, tone, caption } = props;
  const TrendIcon =
    props.trendDirection === "down"
      ? TrendingDown
      : props.trendDirection === "flat"
        ? Minus
        : TrendingUp;
  const trendClass =
    props.trendTone === "bad"
      ? "text-rose-700"
      : props.trendTone === "neutral"
        ? "text-slate-500"
        : "text-emerald-700";

  return (
    <div>
      <div className="flex items-center gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
          style={{ backgroundColor: `${tone}18`, color: tone }}
        >
          <Icon size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-xl font-bold text-slate-950">{value}</p>
          <p className="truncate text-xs font-bold uppercase text-slate-500">{label}</p>
          {caption ? <p className="truncate text-xs font-bold text-slate-500">{caption}</p> : null}
        </div>
      </div>
      {props.trendLabel ? (
        <div className={`mt-3 flex items-center gap-2 text-xs font-bold ${trendClass}`}>
          <TrendIcon size={14} />
          <span className="truncate">{props.trendLabel}</span>
        </div>
      ) : null}
    </div>
  );
}

export function DashboardStatCard(props: DashboardStatCardProps) {
  const baseClasses =
    "group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-200";
  const interactiveClasses =
    "cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:scale-[0.98] active:shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-100";

  if (props.onClick) {
    return (
      <button onClick={props.onClick} className={`${baseClasses} ${interactiveClasses} w-full`}>
        <div className="absolute inset-0 bg-slate-50 opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100" />
        <div className="relative">
          <CardInner {...props} />
        </div>
      </button>
    );
  }

  return (
    <section className={baseClasses}>
      <CardInner {...props} />
    </section>
  );
}
