import { Eye, Clock, Play, ChevronRight } from "lucide-react";
import { CourseLesson } from "@/services/courseApi";
import { AppDrawer } from "@/components/ModernUi";
import { Card } from "@/components/common/Card";

function parseMarkdownToHtml(text: string): string {
  if (!text) return "";

  let formatted = text;

  // 1. Parse bold (**text** or __text__)
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/__(.*?)__/g, "<strong>$1</strong>");

  // 2. Parse italic (*text* or _text_)
  formatted = formatted.replace(/_([^_]+)_/g, "<em>$1</em>");
  formatted = formatted.replace(/\*([^\*\n]+)\*/g, "<em>$1</em>");

  // 3. Clean up list markers inside existing lists
  formatted = formatted.replace(/<li>\s*[\*\-\+]\s+/g, "<li>");

  // 4. Group list blocks if raw Markdown
  const hasHtml = /<[a-z][\s\S]*>/i.test(text);
  if (!hasHtml) {
    formatted = formatted.replace(/\r\n/g, "\n");
    formatted = formatted.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
    formatted = formatted.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
    formatted = formatted.replace(/^# (.*?)$/gm, "<h1>$1</h1>");
    formatted = formatted.replace(/^\s*[\*\-\+]\s+(.*?)$/gm, "<li>$1</li>");
    formatted = formatted.replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>");
    formatted = formatted.replace(/<\/ul>\s*<ul>/g, "");

    const paragraphs = formatted.split(/\n\s*\n/);
    formatted = paragraphs
      .map((p) => {
        const trimmed = p.trim();
        if (!trimmed) return "";
        if (/^<[a-z]/i.test(trimmed)) return trimmed;
        return `<p>${trimmed}</p>`;
      })
      .join("\n");
  } else {
    // Strip standalone leading markdown markers inside paragraphs
    formatted = formatted.replace(/(<p[^>]*>)\s*[\*\-\+]\s+/g, "$1");
  }

  return formatted;
}

interface LessonDetailsDrawerProps {
  lesson: CourseLesson | null;
  open: boolean;
  onClose: () => void;
  onStartLearning: () => void;
}

export function LessonDetailsDrawer({
  lesson,
  open,
  onClose,
  onStartLearning,
}: LessonDetailsDrawerProps) {
  if (!lesson) return null;

  return (
    <AppDrawer open={open} onClose={onClose} title="Lesson Details" size="xl">
      <div className="space-y-6 pb-20">
        {/* Header Section */}
        <div className="rounded-xl bg-emerald-700 p-6 text-white shadow-md">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur-md">
              {lesson.status}
            </span>
            {lesson.topic && (
              <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur-md">
                Topic: {lesson.topic}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl">{lesson.title}</h2>
          <div className="mt-4 flex items-center gap-4 text-xs font-bold text-emerald-100">
            <span className="flex items-center gap-1.5">
              <Clock size={16} /> {lesson.estimatedMinutes ?? 10} min read
            </span>
          </div>
        </div>

        {/* CBC Competencies & Objectives */}
        {(lesson.learningObjectives || lesson.genericCompetencies?.length > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {lesson.learningObjectives && (
              <Card className="border-l-4 border-emerald-500 bg-white">
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Instructional Objectives
                </h3>
                <p className="text-sm font-medium text-slate-600 italic">
                  {lesson.learningObjectives}
                </p>
              </Card>
            )}
            {(lesson.genericCompetencies?.length > 0 || lesson.crossCuttingIssues?.length > 0) && (
              <Card className="bg-slate-50/50 border-slate-100">
                <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Competencies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {lesson.genericCompetencies?.map((c: string, i: number) => (
                    <span
                      key={i}
                      className="rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800"
                    >
                      {c}
                    </span>
                  ))}
                  {lesson.crossCuttingIssues?.map((c: string, i: number) => (
                    <span
                      key={i}
                      className="rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Lesson Development / Content */}
        {lesson.notes || lesson.body ? (
          <Card className="bg-white">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Lesson Development
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                <Eye size={12} /> Content Preview
              </span>
            </div>
            <div
              className="prose prose-emerald prose-sm max-w-none text-slate-700"
              dangerouslySetInnerHTML={{
                __html: parseMarkdownToHtml(lesson.notes || lesson.body || ""),
              }}
            />
          </Card>
        ) : null}

        {/* Video Attachment */}
        {lesson.videoUrl || lesson.mediaUrl ? (
          <Card>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Media</h3>
            <div className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 bg-slate-50">
              <div className="grid h-10 w-10 place-items-center rounded bg-indigo-100 text-indigo-600">
                <Play size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700 truncate">Lesson Video</p>
                <p className="text-xs text-slate-500 truncate">
                  {lesson.videoUrl ?? lesson.mediaUrl}
                </p>
              </div>
            </div>
          </Card>
        ) : null}

        {/* Homework / Assessments */}
        {lesson.homework ? (
          <Card className="border-l-4 border-l-amber-400 bg-white">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-amber-700">
              Homework & Assessments
            </h3>
            <div
              className="text-sm text-slate-700 prose prose-slate prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(lesson.homework) }}
            />
          </Card>
        ) : null}

        {/* Start Button Fixed at Bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-slate-200 shadow-lg sm:absolute">
          <button
            onClick={onStartLearning}
            className="w-full flex justify-center items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 active:bg-emerald-800"
          >
            Start Learning <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </AppDrawer>
  );
}
