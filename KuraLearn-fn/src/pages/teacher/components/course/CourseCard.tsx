import { useState } from "react";
import {
  BookOpen,
  Edit3,
  Trash2,
  Eye,
  Archive,
  Send,
  MoreVertical,
  Layers,
  FileText,
  Users,
  Plus,
} from "lucide-react";
import { CourseRecord } from "@/services/lmsService";
import { Card } from "@/components/common/Card";
import { StatusBadge } from "@/components/ModernUi";

export function CourseCard({
  course,
  onEdit,
  onView,
  onAssign,
  onAction,
}: {
  course: CourseRecord;
  onEdit: () => void;
  onView: () => void;
  onAssign: () => void;
  onAction: (kind: "delete" | "publish" | "unpublish" | "archive" | "duplicate") => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const unitCount = course._count?.units ?? course.units?.length ?? 0;
  const lessonCount = course._count?.lessons ?? course.lessons?.length ?? 0;
  const enrollmentCount = course._count?.enrollments ?? course.enrollments?.length ?? 0;

  return (
    <Card className="group relative transition hover:shadow-md">
      <div className="mb-4 flex h-24 items-end rounded-lg bg-[#6d3eeb] p-3">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-white/80" />
          <span className="text-xs font-bold text-white/90">{course.subject?.name ?? "—"}</span>
        </div>
      </div>

      <h3 className="text-base font-bold text-slate-950 line-clamp-2">{course.title}</h3>
      <p className="mt-1 text-sm text-slate-500 line-clamp-2">
        {course.description || "No description"}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge value={course.status} />
        <span className="text-xs font-semibold text-slate-500">{course.level?.name}</span>
        {course.language && (
          <span className="text-xs font-semibold text-slate-500 uppercase">{course.language}</span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1">
          <Layers size={13} /> {unitCount} units
        </span>
        <span className="flex items-center gap-1">
          <FileText size={13} /> {lessonCount} lessons
        </span>
        <span className="flex items-center gap-1">
          <Users size={13} /> {enrollmentCount} enrolled
        </span>
      </div>

      <div className="absolute right-3 top-3">
        <button
          aria-label="More options"
          onClick={() => setMenuOpen(!menuOpen)}
          className="grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-slate-600 shadow-sm backdrop-blur transition hover:bg-white"
        >
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <>
            <button
              className="fixed inset-0 z-20"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            />
            <div className="absolute right-0 top-10 z-30 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
              <button
                onClick={() => {
                  onView();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Eye size={15} /> View Details
              </button>
              <button
                onClick={() => {
                  onEdit();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Edit3 size={15} /> Edit
              </button>
              <button
                onClick={() => {
                  onAssign();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Users size={15} /> Assign
              </button>
              {course.status === "DRAFT" ? (
                <button
                  onClick={() => {
                    onAction("publish");
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  <Send size={15} /> Publish
                </button>
              ) : course.status === "PUBLISHED" ? (
                <button
                  onClick={() => {
                    onAction("unpublish");
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
                >
                  <Archive size={15} /> Unpublish
                </button>
              ) : null}
              <button
                onClick={() => {
                  onAction("archive");
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
              >
                <Archive size={15} /> Archive
              </button>
              <button
                onClick={() => {
                  onAction("duplicate");
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50"
              >
                <Plus size={15} /> Duplicate
              </button>
              <div className="border-t border-slate-100" />
              <button
                onClick={() => {
                  onAction("delete");
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
