import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ArrowLeft,
  Layers,
  Clock,
  Sparkles,
  Play,
  Paperclip,
  CheckCircle2,
  Circle,
  Bot,
  Sidebar,
} from "lucide-react";
import { Card } from "@/components/common/Card";
import { useLessonDetails, useCompleteLesson } from "@/hooks/useStudentPortal";
import { Loader2, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";

function getEmbedUrl(url: string): {
  type: "youtube" | "vimeo" | "direct" | "other";
  embedUrl: string;
} {
  if (!url) return { type: "other", embedUrl: "" };

  // YouTube
  const ytRegex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = url.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}` };
  }

  // Vimeo
  const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    return { type: "vimeo", embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  // Direct video
  if (url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) {
    return { type: "direct", embedUrl: url };
  }

  return { type: "other", embedUrl: url };
}

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

export function StudentLessonViewPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const lessonQuery = useLessonDetails(lessonId!);
  const completeMutation = useCompleteLesson();

  const lessonData = lessonQuery.data;
  const lesson = lessonData?.lesson;
  const navigation = lessonData?.navigation;
  const progressStatus = lessonData?.progress?.status || lesson?.progressStatus;
  const courseLessons = lessonData?.lesson?.courseLessons || [];

  if (lessonQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
        <Loader2 size={20} className="animate-spin" /> Loading lesson...
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-bold text-slate-600">Lesson not found</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm font-semibold text-emerald-700 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto px-2 lg:px-4 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="hidden lg:block h-4 w-[1px] bg-slate-200" />

          <button
            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
            title={isSidebarVisible ? "Hide Sidebar (Immersive Reading Mode)" : "Show Sidebar"}
          >
            <Sidebar
              size={14}
              className={isSidebarVisible ? "text-slate-500" : "text-emerald-700"}
            />
            <span>{isSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}</span>
          </button>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          <span>{lesson.course?.title || "Course"}</span>
          <span>/</span>
          <span className="text-emerald-700">{lesson.title}</span>
        </div>
      </div>

      <div
        className={`grid gap-6 transition-all duration-300 ${isSidebarVisible ? "lg:grid-cols-[1fr_320px]" : "grid-cols-1 max-w-4xl mx-auto"}`}
      >
        {/* Main Content Area */}
        <div className="min-w-0">
          {/* Clean Lesson Header (No card background) */}
          <div className="mb-6 pb-6 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 border border-emerald-100">
                {lesson.subject?.name || "Subject"}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                {lesson.course?.level?.name || "Level"}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl leading-tight tracking-tight">
              {lesson.title}
            </h1>

            {lesson.topic && (
              <p className="mt-2 flex items-center gap-2 text-slate-500 font-bold text-lg">
                <Layers size={18} className="text-slate-500" /> {lesson.topic}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock size={14} /> {lesson.estimatedMinutes ?? 10} min read
              </span>
              {lesson.contentType && (
                <>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="flex items-center gap-1.5 uppercase tracking-wide">
                    {lesson.contentType} Format
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Video / Media */}
          {(lesson.videoUrl || lesson.mediaUrl) &&
            (() => {
              const mediaSource = lesson.videoUrl || lesson.mediaUrl || "";
              const { type, embedUrl } = getEmbedUrl(mediaSource);

              return (
                <Card className="mb-6 overflow-hidden p-0 shadow-md border-slate-100 bg-slate-950">
                  {type === "youtube" || type === "vimeo" ? (
                    <div className="relative w-full aspect-video">
                      <iframe
                        src={embedUrl}
                        title="Lesson Video Resource"
                        className="absolute inset-0 w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : type === "direct" ? (
                    <div className="relative w-full aspect-video bg-slate-950 flex items-center justify-center">
                      <video src={embedUrl} controls className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="relative aspect-video bg-slate-900 flex flex-col items-center justify-center p-6 text-center group">
                      <div
                        onClick={() => window.open(mediaSource, "_blank")}
                        className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-all shadow-lg border border-white/20 mb-4 cursor-pointer"
                      >
                        <Play
                          size={32}
                          className="text-emerald-400 fill-emerald-400 ml-1 animate-pulse"
                        />
                      </div>
                      <h3 className="text-sm font-bold text-slate-200 mb-1">
                        External Educational Resource
                      </h3>
                      <p className="text-xs text-slate-500 max-w-sm mb-3">
                        Click play to launch this learning resource in a secure new tab.
                      </p>
                      <a
                        href={mediaSource}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold uppercase tracking-wide text-emerald-400 hover:text-emerald-300 underline"
                      >
                        Open Link Directly
                      </a>
                    </div>
                  )}
                </Card>
              );
            })()}

          {/* Content Body */}
          <Card className="mb-6 shadow-sm border-slate-100">
            <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Lesson Content
              </h2>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <BookOpen size={12} /> CBC Interactive
              </span>
            </div>

            {!(lesson.body || lesson.notes || lesson.description) ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                <Sparkles size={32} className="mx-auto text-emerald-700 mb-3" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2">
                  Interactive Study Material
                </h3>
                <p className="text-sm font-medium text-slate-500 max-w-md mx-auto leading-relaxed">
                  This lesson doesn't have written notes yet, but you can learn it actively! Click
                  the **AI Tutor** button in the sidebar to start a guided conversation and practice
                  questions on this topic.
                </p>
              </div>
            ) : (
              <>
                {lesson.description && (
                  <div
                    className="mb-8 border-l-4 border-indigo-200 pl-6 text-xl text-slate-500 italic font-medium leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(lesson.description) }}
                  />
                )}

                <div
                  className="prose-wrapper text-slate-800 leading-relaxed font-medium"
                  dangerouslySetInnerHTML={{
                    __html: parseMarkdownToHtml(lesson.notes || lesson.body || ""),
                  }}
                />
              </>
            )}
          </Card>

          {/* Attachments */}
          {lesson.attachments && lesson.attachments.length > 0 && (
            <Card className="mb-6 bg-slate-50 border-slate-200 shadow-sm">
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Downloads & Resources
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {lesson.attachments.map((file: string, idx: number) => (
                  <a
                    key={idx}
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl bg-white p-3 border border-slate-200 hover:border-emerald-500 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Paperclip size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-700 truncate">
                        {file.split("/").pop()}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                        Attachment File
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Homework */}
          {lesson.homework && (
            <Card className="mb-6 border-l-4 border-l-amber-400 bg-amber-50/30">
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                Homework / Practical Work
              </h2>
              <div
                className="text-lg font-medium text-slate-700 prose prose-slate max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(lesson.homework) }}
              />
            </Card>
          )}

          {/* Navigation */}
          <div className="mt-12 mb-20 flex items-center justify-between gap-4">
            <button
              onClick={() => {
                if (navigation?.previousLessonId) {
                  navigate(`/student/lessons/${navigation.previousLessonId}`);
                  window.scrollTo(0, 0);
                } else {
                  navigate(-1);
                }
              }}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
            >
              <ChevronLeft size={20} />
              {navigation?.previousLessonId ? "Previous Lesson" : "Back to Course"}
            </button>

            <button
              onClick={() => {
                completeMutation.mutate(lesson.id, {
                  onSuccess: (data: any) => {
                    if (data.nextLessonId) {
                      navigate(`/student/lessons/${data.nextLessonId}`);
                      window.scrollTo(0, 0);
                    } else {
                      navigate(`/student/courses/${lesson.courseId}`);
                    }
                  },
                });
              }}
              disabled={completeMutation.isPending}
              className="flex items-center gap-2 rounded-2xl bg-emerald-700 px-10 py-4 text-sm font-bold text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {completeMutation.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <CheckCircle2 size={20} />
              )}
              {navigation?.nextLessonId ? "Mark Done & Next" : "Complete Course"}
            </button>
          </div>
        </div>

        {/* Sidebar Learning Track */}
        {isSidebarVisible && (
          <aside className="hidden lg:block sticky top-8 h-fit space-y-6">
            <Card className="shadow-md border-slate-100">
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Learning Track
                </h3>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-slate-900">
                      {lessonData?.progress?.percent || 0}%
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                      Course Progress
                    </p>
                  </div>
                  <div className="h-2 w-24 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${lessonData?.progress?.percent || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                {courseLessons.map((l: any, idx: number) => {
                  const isActive = l.id === lesson.id;
                  const isCompleted = l.status === "COMPLETED";

                  return (
                    <button
                      key={l.id}
                      onClick={() => navigate(`/student/lessons/${l.id}`)}
                      className="relative flex items-start gap-4 w-full text-left group"
                    >
                      <div
                        className={`relative z-10 mt-1 flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full border-2 bg-white transition-all duration-300 ${
                          isActive
                            ? "border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)] scale-110"
                            : isCompleted
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-slate-200 group-hover:border-slate-300"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 size={14} className="text-white" />
                        ) : isActive ? (
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p
                          className={`text-xs font-bold leading-tight transition-colors ${
                            isActive
                              ? "text-emerald-700"
                              : isCompleted
                                ? "text-slate-900"
                                : "text-slate-500 group-hover:text-slate-700"
                          }`}
                        >
                          {idx + 1}. {l.title}
                        </p>
                        {isActive && (
                          <span className="mt-1 inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                            Current Lesson
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="bg-slate-900 text-white border-none shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                  <Bot size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">AI Tutor</h4>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-tight">
                    Always available
                  </p>
                </div>
              </div>
              <p className="text-xs text-white/70 leading-relaxed font-medium">
                Stuck on a concept? I can explain it simply or give you more examples.
              </p>
              <button
                onClick={() => navigate(`/ai?lessonId=${lesson.id}`)}
                className="mt-5 w-full rounded-xl bg-white py-2.5 text-xs font-bold text-slate-900 hover:bg-emerald-50 transition-colors shadow-lg"
              >
                Ask AI Assistant
              </button>
            </Card>
          </aside>
        )}

        <style>{`
          .prose-wrapper h1,
          .prose-wrapper h2,
          .prose-wrapper h3 {
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.02em;
            line-height: 1.3;
          }
          .prose-wrapper h1 { font-size: 2rem; margin-top: 2.5rem; margin-bottom: 1.25rem; border-left: 5px solid #10b981; padding-left: 0.75rem; }
          .prose-wrapper h2 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; color: #1f2937; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem; }
          .prose-wrapper h3 { font-size: 1.15rem; margin-top: 1.75rem; margin-bottom: 0.75rem; color: #047857; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 900; }
          
          .prose-wrapper p {
            color: #334155;
            font-size: 1.05rem;
            line-height: 1.85;
            margin-bottom: 1.25rem;
            font-weight: 500;
          }
          .prose-wrapper ul {
            list-style-type: disc !important;
            margin-bottom: 1.75rem;
            padding-left: 1.5rem !important;
            background: #f8fafc;
            padding: 1.25rem 1.25rem 1.25rem 2.25rem;
            border-radius: 1rem;
            border: 1px solid #f1f5f9;
          }
          .prose-wrapper ol {
            list-style-type: decimal !important;
            margin-bottom: 1.75rem;
            padding-left: 1.5rem !important;
            background: #f8fafc;
            padding: 1.25rem 1.25rem 1.25rem 2.25rem;
            border-radius: 1rem;
            border: 1px solid #f1f5f9;
          }
          .prose-wrapper li {
            margin-bottom: 0.5rem;
            color: #334155;
            font-weight: 500;
            line-height: 1.7;
            display: list-item !important;
          }
          .prose-wrapper li::marker {
            color: #10b981;
            font-weight: 800;
          }
          .prose-wrapper strong {
            color: #0f172a;
            font-weight: 800;
          }
          .prose-wrapper blockquote {
            border-left: 4px solid #10b981;
            background: #ecfdf5;
            padding: 1.25rem;
            border-radius: 0 0.75rem 0.75rem 0;
            font-style: italic;
            color: #065f46;
            margin-bottom: 1.75rem;
          }
        `}</style>
      </div>
    </div>
  );
}
