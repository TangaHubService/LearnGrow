import { ArrowLeft, Loader2, Plus, FileText, Globe, Layers, Users, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/ModernUi";
import { CourseRecord } from "@/services/lmsService";

export function CourseHeader({
  course,
  isGeneratingOutline,
  onGenerateOutline,
  onAddAssignment,
  onAddQuiz,
  onAddUnit,
  onAssignCourse,
  onAddLesson,
}: {
  course: CourseRecord;
  isGeneratingOutline: boolean;
  onGenerateOutline: () => void;
  onAddAssignment: () => void;
  onAddQuiz: () => void;
  onAddUnit: () => void;
  onAssignCourse: () => void;
  onAddLesson: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="mb-5">
      <button
        onClick={() => navigate("/teacher/courses")}
        className="mb-3 flex items-center gap-1 text-sm font-semibold text-[#6d3eeb] hover:underline"
      >
        <ArrowLeft size={15} /> Back to Courses
      </button>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">{course.title}</h1>
            <StatusBadge value={course.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {course.subject?.name} · {course.level?.name}
            {course.language ? ` · ${course.language.toUpperCase()}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={isGeneratingOutline} onClick={onGenerateOutline}>
            {isGeneratingOutline ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Sparkles size={15} className="text-[#6d3eeb]" />
            )}
            AI Outline
          </Button>
          <Button variant="secondary" onClick={onAddAssignment}>
            <FileText size={15} /> Add Assignment
          </Button>
          <Button variant="secondary" onClick={onAddQuiz}>
            <Globe size={15} /> Add Quiz
          </Button>
          <Button variant="secondary" onClick={onAddUnit}>
            <Layers size={15} /> Add Unit
          </Button>
          <Button variant="secondary" onClick={onAssignCourse}>
            <Users size={15} /> Assign Course
          </Button>
          <Button onClick={onAddLesson}>
            <Plus size={15} /> Add Lesson
          </Button>
        </div>
      </div>
    </div>
  );
}
