import { StudentIcon } from "./StudentShared";

export function BadgeTile({ badge }: { badge: any }) {
  if (!badge) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <StudentIcon name={badge.icon || "Award"} className="h-5 w-5 text-amber-700" />
      <p className="mt-2 text-sm font-bold text-slate-900">{badge.name}</p>
      <p className="text-[10px] font-semibold text-slate-500">{badge.rewardPoints || 0} stars</p>
    </div>
  );
}
