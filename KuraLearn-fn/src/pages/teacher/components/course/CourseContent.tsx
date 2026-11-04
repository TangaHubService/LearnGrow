import { Edit3, FileText, Globe, Layers, Plus, Trash2, Send } from "lucide-react";
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CourseRecord, CourseUnit, CourseLesson } from "@/services/lmsService";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/ModernUi";
import { UnitCard } from "./UnitCard";

export function CourseContent({
  course,
  onAddUnit,
  onAddLesson,
  onEditUnit,
  onDeleteUnit,
  onEditLesson,
  onDeleteLesson,
  onPublishLesson,
  onReorderUnits,
  onReorderLessons,
  onEditAssignment,
  onDeleteAssignment,
  onEditQuiz,
  onDeleteQuiz,
}: {
  course: CourseRecord;
  onAddUnit: () => void;
  onAddLesson: (unitId?: string) => void;
  onEditUnit: (unit: CourseUnit) => void;
  onDeleteUnit: (unit: CourseUnit) => void;
  onEditLesson: (lesson: CourseLesson) => void;
  onDeleteLesson: (lesson: CourseLesson) => void;
  onPublishLesson: (lesson: CourseLesson) => void;
  onReorderUnits: (unitIds: string[]) => void;
  onReorderLessons: (lessonIds: string[]) => void;
  onEditAssignment: (assignment: any) => void;
  onDeleteAssignment: (assignment: any) => void;
  onEditQuiz: (quiz: any) => void;
  onDeleteQuiz: (quiz: any) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleUnitDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldUnitIds = course.units.map((u) => u.id);
      const oldIndex = oldUnitIds.indexOf(active.id as string);
      const newIndex = oldUnitIds.indexOf(over.id as string);
      const nextIds = [...oldUnitIds];
      nextIds.splice(oldIndex, 1);
      nextIds.splice(newIndex, 0, active.id as string);
      onReorderUnits(nextIds);
    }
  }

  if (course.units.length === 0 && course.lessons.filter((l) => !l.unitId).length === 0) {
    return (
      <Card className="py-16 text-center">
        <Layers size={40} className="mx-auto text-slate-500" />
        <p className="mt-3 text-lg font-bold text-slate-600">No content yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Start by adding units and lessons to your course.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="secondary" onClick={onAddUnit}>
            <Layers size={15} /> Add Unit
          </Button>
          <Button onClick={() => onAddLesson()}>
            <Plus size={15} /> Add Lesson
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleUnitDragEnd}
      >
        <SortableContext
          items={course.units.map((u) => u.id)}
          strategy={verticalListSortingStrategy}
        >
          {course.units.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              onEdit={() => onEditUnit(unit)}
              onDelete={() => onDeleteUnit(unit)}
              onAddLesson={() => onAddLesson(unit.id)}
              onEditLesson={onEditLesson}
              onDeleteLesson={onDeleteLesson}
              onPublishLesson={onPublishLesson}
              onReorderLessons={(lessonIds) => onReorderLessons(lessonIds)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Standalone lessons, assignments, and quizzes (not in any unit) */}
      {(course.lessons.filter((l) => !l.unitId).length > 0 ||
        course.assignments.length > 0 ||
        course.quizzes.length > 0) && (
        <Card>
          <h3 className="mb-3 text-sm font-bold text-slate-950">Independent Materials</h3>
          <div className="space-y-2">
            {course.lessons
              .filter((l) => !l.unitId)
              .map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 hover:bg-slate-50"
                >
                  <FileText size={15} className="text-slate-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{lesson.title}</p>
                    <p className="text-xs text-slate-500">Lesson · {lesson.estimatedMinutes} min</p>
                  </div>
                  <StatusBadge value={lesson.status} />
                  {lesson.status !== "PUBLISHED" && (
                    <button
                      onClick={() => onPublishLesson(lesson)}
                      className="grid h-7 w-7 place-items-center rounded text-emerald-700 hover:bg-emerald-50"
                      title="Publish"
                    >
                      <Send size={13} />
                    </button>
                  )}
                  <button
                    aria-label="Edit"
                    onClick={() => onEditLesson(lesson)}
                    className="grid h-7 w-7 place-items-center rounded text-slate-500 hover:bg-slate-100"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    aria-label="Delete"
                    onClick={() => onDeleteLesson(lesson)}
                    className="grid h-7 w-7 place-items-center rounded text-slate-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

            {course.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 hover:bg-slate-50"
              >
                <FileText size={15} className="text-sky-700" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{assignment.title}</p>
                  <p className="text-xs text-slate-500">
                    Assignment · Max Score: {assignment.maxScore}
                  </p>
                </div>
                <button
                  aria-label="Edit"
                  onClick={() => onEditAssignment(assignment)}
                  className="grid h-7 w-7 place-items-center rounded text-slate-500 hover:bg-slate-100"
                >
                  <Edit3 size={13} />
                </button>
                <button
                  aria-label="Delete"
                  onClick={() => onDeleteAssignment(assignment)}
                  className="grid h-7 w-7 place-items-center rounded text-slate-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            {course.quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 hover:bg-slate-50"
              >
                <Globe size={15} className="text-amber-700" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{quiz.title}</p>
                  <p className="text-xs text-slate-500">
                    Quiz · {quiz.durationMinutes} min · {quiz.questions?.length ?? 0} questions
                  </p>
                </div>
                <button
                  aria-label="Edit"
                  onClick={() => onEditQuiz(quiz)}
                  className="grid h-7 w-7 place-items-center rounded text-slate-500 hover:bg-slate-100"
                >
                  <Edit3 size={13} />
                </button>
                <button
                  aria-label="Delete"
                  onClick={() => onDeleteQuiz(quiz)}
                  className="grid h-7 w-7 place-items-center rounded text-slate-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
