import { AssessmentStatus, AssessmentType, AssessmentVisibility } from "@/services/assessmentApi";

export const TYPE_LABELS: Record<AssessmentType, string> = {
  ASSIGNMENT: "Assignment",
  QUIZ: "Quiz",
  TEST: "Test",
  CAT: "CAT",
  EXAM: "Exam",
  PRACTICE_ASSESSMENT: "Practice Assessment",
  PROJECT: "Project",
  PRACTICAL: "Practical",
  ORAL: "Oral",
  HOMEWORK: "Homework",
};

export const TYPE_COLORS: Record<AssessmentType, string> = {
  ASSIGNMENT: "bg-violet-50 text-violet-700",
  QUIZ: "bg-blue-50 text-blue-700",
  TEST: "bg-cyan-50 text-cyan-700",
  CAT: "bg-amber-50 text-amber-700",
  EXAM: "bg-red-50 text-red-700",
  PRACTICE_ASSESSMENT: "bg-emerald-50 text-emerald-700",
  PROJECT: "bg-emerald-50 text-emerald-700",
  PRACTICAL: "bg-amber-50 text-amber-700",
  ORAL: "bg-pink-50 text-pink-700",
  HOMEWORK: "bg-slate-50 text-slate-600",
};

export const VIS_COLORS: Record<AssessmentStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PUBLISHED: "bg-blue-100 text-blue-700",
  SCHEDULED: "bg-cyan-100 text-cyan-700",
  CLOSED: "bg-red-100 text-red-600",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

export function TypeBadge({ type }: { type: AssessmentType }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[type]}`}>
      {TYPE_LABELS[type]}
    </span>
  );
}

export function VisBadge({ vis }: { vis: AssessmentVisibility }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${VIS_COLORS[vis]}`}>
      {vis.replace("_", " ").charAt(0) + vis.replace("_", " ").slice(1).toLowerCase()}
    </span>
  );
}

export function StatusBadge({ status }: { status: AssessmentStatus }) {
  const label =
    status.replace("_", " ").charAt(0) + status.replace("_", " ").slice(1).toLowerCase();
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${VIS_COLORS[status]}`}>
      {label}
    </span>
  );
}
