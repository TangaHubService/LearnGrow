import { formatStatus } from "@/utils/formatters";

export const STATUS_COLORS = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  warning: "bg-amber-50 text-amber-700 border-amber-100",
  error: "bg-rose-50 text-rose-700 border-rose-100",
  info: "bg-blue-50 text-blue-700 border-blue-100",
  neutral: "bg-slate-50 text-slate-700 border-slate-100",
  purple: "bg-purple-50 text-[#6d3eeb] border-purple-100",
} as const;

export type StatusTone = keyof typeof STATUS_COLORS;

export function StatusBadge({ value, tone }: { value?: unknown; tone?: StatusTone }) {
  const label = formatStatus(value);
  const normalized = label.toLowerCase();

  const resolvedTone: StatusTone =
    tone ??
    (normalized.includes("active") ||
    normalized.includes("paid") ||
    normalized.includes("completed") ||
    normalized.includes("published") ||
    normalized.includes("taught") ||
    normalized.includes("marked")
      ? "success"
      : normalized.includes("pending") ||
          normalized.includes("draft") ||
          normalized.includes("assigned") ||
          normalized.includes("to mark")
        ? "warning"
        : normalized.includes("suspended") ||
            normalized.includes("archived") ||
            normalized.includes("rejected") ||
            normalized.includes("unpaid") ||
            normalized.includes("overdue") ||
            normalized.includes("failed")
          ? "error"
          : normalized.includes("progress") ||
              normalized.includes("info") ||
              normalized.includes("sent")
            ? "info"
            : "neutral");

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors ${STATUS_COLORS[resolvedTone]}`}
    >
      {label}
    </span>
  );
}
