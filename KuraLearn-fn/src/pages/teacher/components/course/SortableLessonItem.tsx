import { GripVertical, FileText, Send, Edit3, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StatusBadge } from "@/components/ModernUi";
import type { CourseLesson } from "@/services/lmsService";

interface SortableLessonItemProps {
  lesson: CourseLesson;
  onEdit: (lesson: CourseLesson) => void;
  onDelete: (lesson: CourseLesson) => void;
  onPublish: (lesson: CourseLesson) => void;
}

export function SortableLessonItem({
  lesson,
  onEdit,
  onDelete,
  onPublish,
}: SortableLessonItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2.5 transition hover:bg-slate-50"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-slate-500 hover:text-slate-500"
      >
        <GripVertical size={16} />
      </button>
      <FileText size={15} className="shrink-0 text-slate-500" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{lesson.title}</p>
        <p className="text-xs text-slate-500">{lesson.estimatedMinutes} min</p>
      </div>
      <StatusBadge value={lesson.status} />
      {lesson.status !== "PUBLISHED" ? (
        <button
          onClick={() => onPublish(lesson)}
          className="grid h-7 w-7 place-items-center rounded text-emerald-700 hover:bg-emerald-50"
          title="Publish"
        >
          <Send size={13} />
        </button>
      ) : null}
      <button
        aria-label="Edit"
        onClick={() => onEdit(lesson)}
        className="grid h-7 w-7 place-items-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      >
        <Edit3 size={13} />
      </button>
      <button
        aria-label="Delete"
        onClick={() => onDelete(lesson)}
        className="grid h-7 w-7 place-items-center rounded text-slate-500 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
