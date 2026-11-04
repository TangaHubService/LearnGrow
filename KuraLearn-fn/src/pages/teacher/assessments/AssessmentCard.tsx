import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  Sparkles,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { Assessment } from "@/services/assessmentApi";
import { Card } from "@/components/common/Card";
import { StatusBadge, TypeBadge } from "./AssessmentBadges";

export function AssessmentCard({
  a,
  onEdit,
  onDelete,
  onPublish,
  onView,
}: {
  a: Assessment;
  onEdit: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onView: () => void;
}) {
  const status = a.status ?? a.visibility;
  const canEdit = a.permissions?.canEdit ?? true;
  const canDelete = a.permissions?.canDelete ?? true;
  const canPublish = a.permissions?.canPublish ?? a.visibility === "DRAFT";
  const subjectName = a.subject?.name ?? a.course.subject.name;
  const className = a.class?.name ?? "Course-wide";
  const submitted = a.submissionStats?.submitted ?? a._count.submissions;
  const assigned = a.submissionStats?.assignedStudents;
  const dueOrStart = a.dueDate ?? a.startDate;
  return (
    <Card className="flex flex-col gap-3 hover:shadow-md transition-shadow p-5 md:p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <TypeBadge type={a.type} />
          <StatusBadge status={status} />
          {a.aiGenerated && (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
              <Sparkles size={10} />
              AI
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onView}
            title="View assessment"
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <Eye size={14} />
          </button>
          {canEdit && (
            <button
              onClick={onEdit}
              title="Edit assessment"
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <Edit3 size={14} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              title="Delete assessment"
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{a.title}</h3>
        <p className="mt-0.5 text-xs text-violet-600 font-medium line-clamp-1">
          {subjectName} • {className}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <UserRound size={12} />
          {a.teacher?.user?.name ?? "Teacher"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 border-t border-slate-100 pt-3">
        <span className="flex items-center gap-1">
          <CheckCircle2 size={12} />
          {a.totalMarks} marks
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} />
          {assigned ? `${submitted}/${assigned}` : submitted} submitted
        </span>
        <span className="flex items-center gap-1">
          <BookOpen size={12} />
          {a._count.questions} Qs
        </span>
        {a.durationMinutes && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {a.durationMinutes} min
          </span>
        )}
        {dueOrStart && (
          <span className="flex items-center gap-1">
            <CalendarClock size={12} />
            {a.dueDate ? "Due" : "Starts"} {new Date(dueOrStart).toLocaleDateString()}
          </span>
        )}
        {a.submissionStats?.averageScore !== null &&
          a.submissionStats?.averageScore !== undefined && (
            <span className="flex items-center gap-1">Avg {a.submissionStats.averageScore}</span>
          )}
      </div>

      <div className="flex gap-2 mt-auto pt-2">
        {canPublish && (
          <button
            onClick={onPublish}
            className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Publish
          </button>
        )}
        <button
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Manage <ChevronRight size={12} />
        </button>
      </div>
    </Card>
  );
}
