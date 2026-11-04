import { CheckCircle2, Clock3, Lock, RotateCcw, XCircle } from "lucide-react";

const tones: Record<string, string> = {
  DRAFT: "border-amber-200 bg-amber-50 text-amber-700",
  SUBMITTED: "border-blue-200 bg-blue-50 text-blue-700",
  CORRECTION_REQUESTED: "border-orange-200 bg-orange-50 text-orange-700",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function ApprovalStatusBadge({ status, locked }: { status?: string; locked?: boolean }) {
  const label = (status || "DRAFT").replaceAll("_", " ");
  const Icon =
    locked || status === "APPROVED"
      ? Lock
      : status === "REJECTED"
        ? XCircle
        : status === "CORRECTION_REQUESTED"
          ? RotateCcw
          : status === "SUBMITTED"
            ? Clock3
            : CheckCircle2;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${tones[status || "DRAFT"] ?? tones.DRAFT}`}
    >
      <Icon size={13} />
      {label}
    </span>
  );
}
