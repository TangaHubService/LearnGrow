import { useMemo } from "react";
import {
  BookOpen,
  Clock,
  FileText,
  Globe,
  Lightbulb,
  ListChecks,
  PenTool,
  Target,
  Sparkles,
  Calendar,
  Users,
  Layers,
} from "lucide-react";
import { RichTextViewer } from "@/components/editor/RichTextEditor";
import { StatusBadge } from "@/components/ModernUi";

interface PremiumLessonViewProps {
  lesson: {
    title: string;
    className?: string;
    subjectName?: string;
    teacherName?: string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
    lessonContentHtml?: string;
    content?: string;
    estimatedMinutes?: number;
    homework?: string;
    notes?: string;
    [key: string]: any;
  };
}

export function PremiumLessonView({ lesson }: PremiumLessonViewProps) {
  const content = lesson.lessonContentHtml || lesson.content || "";

  return (
    <div className="premium-lesson-view max-w-5xl mx-auto space-y-8 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Premium Header */}
      <header className="relative overflow-hidden rounded-2xl bg-[#6d3eeb] p-8 sm:p-12 text-white shadow-lg">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wide backdrop-blur-xl border border-white/10">
              <Globe size={14} className="text-purple-200" /> {lesson.className || "General Class"}
            </span>
            <span className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wide backdrop-blur-xl border border-white/10">
              <BookOpen size={14} className="text-purple-200" /> {lesson.subjectName || "Subject"}
            </span>
            <StatusBadge
              value={lesson.status}
              tone={lesson.status === "PUBLISHED" ? "success" : "neutral"}
            />
          </div>

          <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl leading-[1.1] mb-2 tracking-tight">
            {lesson.title || "Untitled Lesson"}
          </h1>
          {lesson.topic && (
            <p className="text-lg font-bold text-purple-200 mb-8 flex items-center gap-2">
              <Layers size={20} className="text-purple-300" />
              Topic: {lesson.topic}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-8 text-sm font-bold text-purple-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                <Clock size={20} className="text-purple-200" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wide text-purple-300">
                  Duration
                </span>
                <span>{lesson.estimatedMinutes || 40} Minutes</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                <Users size={20} className="text-purple-200" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wide text-purple-300">Teacher</span>
                <span>{lesson.teacherName || "Assigned Teacher"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                <Calendar size={20} className="text-purple-200" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wide text-purple-300">
                  Last Updated
                </span>
                <span>
                  {lesson.updatedAt
                    ? new Date(lesson.updatedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "No date"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-12">
        {/* Sidebar / Quick Info */}
        <div className="lg:col-span-4 space-y-8">
          <section className="group rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                <Target size={22} />
              </div>
              <h2 className="font-bold uppercase tracking-wide text-xs text-slate-500">
                Instructional Objectives
              </h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-600 leading-relaxed italic border-l-4 border-indigo-100 pl-4">
                {lesson.learningObjectives ||
                  "By the end of this lesson, learners will be able to master the core concepts through active participation and practical application."}
              </p>
            </div>
          </section>

          {(lesson.genericCompetencies?.length > 0 || lesson.crossCuttingIssues?.length > 0) && (
            <section className="group rounded-2xl border border-purple-100 bg-purple-50/30 p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                  <Sparkles size={22} />
                </div>
                <h2 className="font-bold uppercase tracking-wide text-xs text-purple-400">
                  CBC Competencies
                </h2>
              </div>
              <div className="space-y-6">
                {lesson.genericCompetencies?.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wide text-purple-400 mb-2">
                      Generic Competencies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {lesson.genericCompetencies.map((c: string, i: number) => (
                        <span
                          key={i}
                          className="text-[10px] font-bold bg-white border border-purple-100 text-purple-700 px-2.5 py-1 rounded-lg shadow-sm"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {lesson.crossCuttingIssues?.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wide text-purple-400 mb-2">
                      Cross-Cutting Issues
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {lesson.crossCuttingIssues.map((c: string, i: number) => (
                        <span
                          key={i}
                          className="text-[10px] font-bold bg-white border border-purple-100 text-purple-700 px-2.5 py-1 rounded-lg shadow-sm"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="group rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 transition-colors group-hover:bg-slate-900 group-hover:text-white">
                <ListChecks size={22} />
              </div>
              <h2 className="font-bold uppercase tracking-wide text-xs text-slate-500">
                Materials
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {["Classroom Board & Markers", "Subject Notebooks", "Interactive Resource Pack"].map(
                (m, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl bg-slate-50/50 px-4 py-3 text-xs font-bold text-slate-700"
                  >
                    <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                    {m}
                  </div>
                ),
              )}
            </div>
          </section>

          {lesson.homework && (
            <section className="group rounded-2xl border border-amber-100 bg-amber-50/50 p-8 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                  <PenTool size={22} />
                </div>
                <h2 className="font-bold uppercase tracking-wide text-xs text-amber-600/60">
                  Follow-up Task
                </h2>
              </div>
              <p className="text-sm font-bold text-amber-900 leading-relaxed">{lesson.homework}</p>
            </section>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-10">
          <section className="rounded-2xl border border-slate-100 bg-white p-8 sm:p-12 shadow-sm relative">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3 text-slate-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-[#6d3eeb]">
                  <FileText size={24} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Lesson Development</h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-purple-600 bg-purple-50 px-4 py-2 rounded-full ring-1 ring-purple-100">
                <Sparkles size={14} className="text-purple-400" />
                AI Enhanced Structure
              </div>
            </div>

            <div className="prose-wrapper">
              <RichTextViewer content={content} />
            </div>
          </section>

          {/* Teacher Guidance / Notes */}
          {lesson.notes && (
            <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-8 sm:p-12 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6 text-indigo-700">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm transition-transform group-hover:scale-110">
                    <Lightbulb size={22} />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight">Pedagogical Insights</h2>
                </div>
                <div className="text-sm font-medium text-indigo-950/80 leading-[1.8] whitespace-pre-line bg-white/40 p-6 rounded-2xl backdrop-blur-sm border border-white/50">
                  {lesson.notes}
                </div>
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles size={120} className="text-indigo-600" />
              </div>
            </section>
          )}
        </div>
      </div>

      <style>{`
        .premium-lesson-view .prose-wrapper {
          font-family: 'Outfit', 'Inter', sans-serif;
        }
        .premium-lesson-view .prose-wrapper h1,
        .premium-lesson-view .prose-wrapper h2,
        .premium-lesson-view .prose-wrapper h3 {
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .premium-lesson-view .prose-wrapper h1 { font-size: 2.25rem; margin-top: 3rem; margin-bottom: 1.5rem; border-left: 6px solid #6d3eeb; padding-left: 1rem; }
        .premium-lesson-view .prose-wrapper h2 { font-size: 1.75rem; margin-top: 2.5rem; margin-bottom: 1.25rem; color: #1e293b; }
        .premium-lesson-view .prose-wrapper h3 { font-size: 1.25rem; margin-top: 2rem; margin-bottom: 1rem; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .premium-lesson-view .prose-wrapper p {
          color: #475569;
          font-size: 1.05rem;
          line-height: 1.9;
          margin-bottom: 1.5rem;
        }
        .premium-lesson-view .prose-wrapper ul, 
        .premium-lesson-view .prose-wrapper ol {
          margin-bottom: 2rem;
          padding-left: 1.5rem;
          background: #f8fafc;
          padding: 1.5rem 1.5rem 1.5rem 2.5rem;
          border-radius: 1.5rem;
          border: 1px solid #f1f5f9;
        }
        .premium-lesson-view .prose-wrapper li {
          margin-bottom: 0.75rem;
          color: #475569;
          font-weight: 500;
        }
        .premium-lesson-view .prose-wrapper li::marker {
          color: #6d3eeb;
          font-weight: 900;
        }
        .premium-lesson-view .prose-wrapper strong {
          color: #0f172a;
          font-weight: 800;
          background: linear-gradient(120deg, #e0e7ff 0%, #e0e7ff 100%);
          background-repeat: no-repeat;
          background-size: 100% 0.3em;
          background-position: 0 88%;
        }
        .premium-lesson-view .prose-wrapper blockquote {
          border-left: 4px solid #6d3eeb;
          background: #f5f3ff;
          padding: 1.5rem;
          border-radius: 0 1rem 1rem 0;
          font-style: italic;
          color: #5b21b6;
          margin-bottom: 2rem;
        }
      `}</style>
    </div>
  );
}

export default PremiumLessonView;
