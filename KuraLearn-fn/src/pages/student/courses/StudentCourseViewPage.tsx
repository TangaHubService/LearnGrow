import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BadgeCheck, ArrowLeft, Layers, FileText, Loader2, Play, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/common/Card";
import { StudentUnitCard } from "@/components/students/courses/StudentUnitCard";
import { StudentLessonRow } from "@/components/students/courses/StudentLessonRow";
import { LessonDetailsDrawer } from "@/components/students/courses/LessonDetailsDrawer";

import { useCourseDetails, useStartCourse } from "@/hooks/useStudentPortal";

export function StudentCourseViewPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);

  const courseQuery = useCourseDetails(courseId!);
  const startCourseMutation = useStartCourse();

  const course = courseQuery.data?.course as any;
  const progressPercent = course?.progressPercent || 0;

  if (courseQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
        <Loader2 size={20} className="animate-spin" /> Loading course...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-bold text-slate-600">Course not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      {/* Header Navigation */}
      <button
        onClick={() => navigate("/student/courses")}
        className="mb-4 flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
      >
        <ArrowLeft size={15} /> Back to My Courses
      </button>

      {/* Course Hero Section */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-slate-900 shadow-lg">
        <div className="absolute inset-0 bg-emerald-800/90" />
        {course.coverImage && (
          <img
            src={course.coverImage}
            alt={course.title}
            className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-30"
          />
        )}

        <div className="relative z-10 p-6 sm:px-10 sm:py-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-md">
              {course.subject?.name}
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-md">
              {course.level?.name}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl tracking-tight leading-tight mb-2 uppercase first-letter:capitalize">
            {course.title}
          </h1>

          {course.description && (
            <p className="max-w-2xl text-base font-medium text-emerald-50/80 leading-relaxed mb-4">
              {course.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-emerald-100/70 mb-6">
            <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-3 py-1.5 backdrop-blur-sm border border-white/5">
              <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Layers size={16} className="text-emerald-300" />
              </div>
              <div>
                <p className="text-base font-bold text-white leading-tight">
                  {course.units?.length || 0}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-tight text-emerald-300/80">
                  Units
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-3 py-1.5 backdrop-blur-sm border border-white/5">
              <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center">
                <FileText size={16} className="text-emerald-300" />
              </div>
              <div>
                <p className="text-base font-bold text-white leading-tight">
                  {course.lessons?.length || 0}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-tight text-emerald-300/80">
                  Lessons
                </p>
              </div>
            </div>
            {progressPercent > 0 && (
              <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-3 py-1.5 backdrop-blur-sm border border-white/5">
                <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-emerald-300" />
                </div>
                <div>
                  <p className="text-base font-bold text-white leading-tight">{progressPercent}%</p>
                  <p className="text-[10px] font-bold uppercase tracking-tight text-emerald-300/80">
                    Progress
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => {
                startCourseMutation.mutate(course.id, {
                  onSuccess: (data: any) => {
                    if (data.lessonId) {
                      navigate(`/student/lessons/${data.lessonId}`);
                    }
                  },
                });
              }}
              disabled={startCourseMutation.isPending}
              className="group flex items-center gap-2.5 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-emerald-700 shadow-xl transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50"
            >
              {startCourseMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play
                  size={16}
                  fill="currentColor"
                  className="group-hover:scale-110 transition-transform"
                />
              )}
              {progressPercent > 0 ? "Continue Learning" : "Start Learning"}
            </button>

            <div className="hidden sm:block h-8 w-[1px] bg-white/20 mx-2" />

            <div className="flex flex-col">
              <div className="h-1.5 w-32 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-emerald-100/50">
                Course Progress
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Course Units/Lessons */}
        <div className="space-y-6">
          {course.units && course.units.length > 0 ? (
            course.units.map((unit: any, index: number) => (
              <StudentUnitCard
                key={unit.id}
                unit={unit}
                index={index}
                onViewDetails={setSelectedLesson}
              />
            ))
          ) : (
            <div className="rounded-2xl bg-slate-50 p-12 text-center border-2 border-dashed border-slate-200">
              <Layers size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-500">No units defined for this course</h3>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <aside className="space-y-6">
          {course.learningObjectives && (
            <Card className="rounded-2xl shadow-sm border-slate-100">
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                What you'll learn
              </h2>
              <div
                className="text-sm leading-relaxed text-slate-600 prose prose-emerald prose-sm max-w-none font-medium italic"
                dangerouslySetInnerHTML={{ __html: course.learningObjectives }}
              />
            </Card>
          )}

          <Card className="rounded-2xl bg-emerald-50 border-emerald-100 shadow-sm p-6">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-3">
              Certification
            </h4>
            <p className="text-xs text-emerald-700/80 leading-relaxed font-medium mb-4">
              Complete all lessons and quizzes to earn your official course completion certificate.
            </p>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-emerald-700">
              <BadgeCheck size={14} /> KuraLearn Verified
            </div>
          </Card>
        </aside>
      </div>

      <LessonDetailsDrawer
        lesson={selectedLesson}
        open={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        onStartLearning={() => {
          if (selectedLesson) navigate(`/student/lessons/${selectedLesson.id}`);
        }}
      />
    </div>
  );
}
