import { ReactNode } from "react";
import { TrendingUp } from "lucide-react";

export function AnalyticsMetricCard({
  label,
  value,
  helper,
  icon,
  tone = "slate",
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  icon?: ReactNode;
  tone?: "slate" | "emerald" | "blue" | "purple" | "amber" | "rose";
}) {
  const toneClasses = {
    slate: "bg-slate-900 text-white",
    emerald: "bg-emerald-700 text-white",
    blue: "bg-blue-600 text-white",
    purple: "bg-[#6d3eeb] text-white",
    amber: "bg-amber-600 text-white",
    rose: "bg-rose-600 text-white",
  };

  return (
    <article className={`rounded-lg p-4 shadow-sm ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase">{label}</p>
          <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/15">
          {icon ?? <TrendingUp size={18} />}
        </div>
      </div>
      {helper ? <p className="mt-3 text-xs font-semibold">{helper}</p> : null}
    </article>
  );
}
