import { CheckCircle2, Clock, Users } from "lucide-react";
import { Card } from "@/components/common/Card";

export function AssessmentStats({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Card className="flex items-center gap-4 bg-white p-6 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <Users size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Total Submissions
          </p>
          <p className="text-2xl font-bold text-slate-900">{stats?.total || 0}</p>
        </div>
      </Card>
      <Card className="flex items-center gap-4 bg-white p-6 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Average Score
          </p>
          <p className="text-2xl font-bold text-slate-900">{stats?.avgScore || 0}%</p>
        </div>
      </Card>
      <Card className="flex items-center gap-4 bg-white p-6 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <Clock size={24} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Completion Rate
          </p>
          <p className="text-2xl font-bold text-slate-900">{stats?.completionRate || 0}%</p>
        </div>
      </Card>
    </div>
  );
}
