import { useState } from "react";
import { GripVertical, ChevronDown, ChevronRight, Layers, Edit3, Trash2, Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/common/Card";
import { SortableLessonItem } from "./SortableLessonItem";
import type { CourseUnit, CourseLesson } from "@/services/lmsService";

interface UnitCardProps {
  unit: CourseUnit;
  onEdit: () => void;
  onDelete: () => void;
  onAddLesson: () => void;
  onEditLesson: (lesson: CourseLesson) => void;
  onDeleteLesson: (lesson: CourseLesson) => void;
  onPublishLesson: (lesson: CourseLesson) => void;
  onReorderLessons: (lessonIds: string[]) => void;
}

export function UnitCard({
  unit,
  onEdit,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onPublishLesson,
  onReorderLessons,
}: UnitCardProps) {
  const [expanded, setExpanded] = useState(true);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: unit.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = unit.lessons.findIndex((l) => l.id === active.id);
      const newIndex = unit.lessons.findIndex((l) => l.id === over.id);
      const reordered = arrayMove(unit.lessons, oldIndex, newIndex);
      onReorderLessons(reordered.map((l) => l.id));
    }
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="overflow-visible">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab text-slate-500 hover:text-slate-500"
          >
            <GripVertical size={18} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 text-slate-500 transition hover:text-slate-700"
          >
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          <Layers size={18} className="shrink-0 text-[#6d3eeb]" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-950">{unit.title}</h3>
            {unit.description ? <p className="text-xs text-slate-500">{unit.description}</p> : null}
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {unit.lessons.length} lessons
          </span>
          <button
            aria-label="Edit"
            onClick={onEdit}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <Edit3 size={15} />
          </button>
          <button
            aria-label="Delete"
            onClick={onDelete}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {expanded ? (
          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={unit.lessons.map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                {unit.lessons.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-500">
                    No lessons in this unit yet.
                  </p>
                ) : (
                  unit.lessons.map((lesson) => (
                    <SortableLessonItem
                      key={lesson.id}
                      lesson={lesson}
                      onEdit={onEditLesson}
                      onDelete={onDeleteLesson}
                      onPublish={onPublishLesson}
                    />
                  ))
                )}
              </SortableContext>
            </DndContext>
            <button
              onClick={onAddLesson}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 py-2.5 text-sm font-semibold text-[#6d3eeb] transition hover:border-[#6d3eeb] hover:bg-purple-50"
            >
              <Plus size={15} /> Add Lesson
            </button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
