import { useParams, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  PlayCircle,
  Volume2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  ExternalLink,
  ChevronLeft,
  Calendar,
  Layers,
  Award,
  Tag,
  FileText,
  Pause,
  Play,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StudentCard, StudentEmptyState, SecondaryLink } from "@/components/student/StudentShared";
import { useLibraryResource } from "@/hooks/useStudentPortal";
import { Skeleton } from "@/components/common/Skeleton";

export function ResourceDetailPage() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const { data, isLoading, error, refetch } = useLibraryResource(resourceId || "");

  // Image zoom state
  const [scale, setScale] = useState(1);
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const resolveFileUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    return `${baseUrl.replace(/\/api\/v1$|\/api$/, "")}${url}`;
  };

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      const updateProgress = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => setDuration(audio.duration || 0);

      audio.addEventListener("timeupdate", updateProgress);
      audio.addEventListener("loadedmetadata", updateDuration);

      return () => {
        audio.removeEventListener("timeupdate", updateProgress);
        audio.removeEventListener("loadedmetadata", updateDuration);
      };
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader
          brand="KuraLearn Learning"
          title="Resource"
          subtitle="Loading learning resources..."
        />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <StudentEmptyState
        title="Resource not found"
        message="Return to the library and choose another resource."
        action={
          <button
            onClick={() => refetch()}
            className="mt-4 text-[#6d3eeb] font-bold flex items-center gap-2"
          >
            <RefreshCw size={16} /> Retry
          </button>
        }
      />
    );
  }

  const resource = data;
  const resolvedUrl = resolveFileUrl(resource.fileUrl);
  const typeUpper = String(resource.type).toUpperCase();

  const handleAudioPlayToggle = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleAudioSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Link
          to="/library"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#6d3eeb] transition-colors text-sm font-semibold"
        >
          <ChevronLeft size={16} /> Back to Library
        </Link>

        {resolvedUrl && (
          <a
            href={resolvedUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#6d3eeb] px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-purple-700 hover:shadow-lg transition-all"
          >
            <Download size={16} /> Download
          </a>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main Content & Media Viewer */}
        <div className="space-y-6">
          <StudentCard className="overflow-hidden border border-slate-100 shadow-xl rounded-2xl bg-white p-5">
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{resource.title}</h1>
            <p className="mt-2 text-slate-600 text-sm leading-relaxed">
              {resource.description || "No description provided."}
            </p>

            <div className="mt-6 rounded-2xl bg-slate-950 p-3 shadow-inner">
              {/* Conditional Media Renderers */}
              {typeUpper === "PDF" ? (
                <div className="relative overflow-hidden rounded-xl bg-slate-900">
                  <iframe
                    src={`${resolvedUrl}#toolbar=0`}
                    className="h-[600px] w-full rounded-xl border-none"
                    title={resource.title}
                  />
                </div>
              ) : typeUpper === "VIDEO" ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
                  <video src={resolvedUrl} controls className="h-full w-full object-contain" />
                </div>
              ) : typeUpper === "AUDIO" ? (
                <div className="flex flex-col items-center justify-center py-10 px-6 rounded-xl bg-slate-900 border border-slate-800 text-white">
                  <audio ref={audioRef} src={resolvedUrl} />
                  <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Volume2 className="h-10 w-10 animate-pulse" />
                  </div>

                  {/* Pulsing Visual Waveform */}
                  <div className="flex items-end justify-center gap-1 h-10 mb-8 w-64">
                    {[16, 24, 36, 18, 12, 28, 38, 20, 26, 32, 14, 22, 16, 30, 24, 18].map(
                      (h, i) => (
                        <div
                          key={i}
                          className="w-1.5 rounded-full bg-purple-500 transition-all duration-300"
                          style={{
                            height: isPlaying ? `${h}px` : "4px",
                            opacity: isPlaying ? 0.9 : 0.3,
                            animation: isPlaying
                              ? `bounce 1s ease-in-out infinite alternate`
                              : undefined,
                            animationDelay: `${i * 0.08}s`,
                          }}
                        />
                      ),
                    )}
                  </div>

                  <div className="w-full max-w-md space-y-4">
                    {/* Progress Slider */}
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleAudioSliderChange}
                      className="h-1.5 w-full cursor-pointer rounded-lg bg-slate-800 accent-purple-500 outline-none"
                    />

                    {/* Play Controls */}
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleAudioPlayToggle}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#6d3eeb] text-white shadow-lg hover:bg-purple-700 hover:scale-105 transition-all"
                      >
                        {isPlaying ? (
                          <Pause size={22} fill="currentColor" />
                        ) : (
                          <Play size={22} className="ml-1" fill="currentColor" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : typeUpper === "IMAGE" ? (
                <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-slate-900 p-4">
                  <div className="absolute right-4 top-4 z-10 flex gap-2 rounded-lg bg-slate-950/80 p-1 border border-slate-800">
                    <button
                      onClick={() => setScale((s) => Math.min(3, s + 0.25))}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title="Zoom In"
                    >
                      <ZoomIn size={18} />
                    </button>
                    <button
                      onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title="Zoom Out"
                    >
                      <ZoomOut size={18} />
                    </button>
                    <button
                      onClick={() => setScale(1)}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title="Reset"
                    >
                      <Maximize2 size={18} />
                    </button>
                  </div>

                  <div className="max-h-[500px] w-full overflow-auto flex items-center justify-center">
                    <img
                      src={resolvedUrl}
                      alt={resource.title}
                      className="rounded-lg object-contain transition-transform duration-200 shadow-xl"
                      style={{ transform: `scale(${scale})` }}
                    />
                  </div>
                </div>
              ) : (
                /* Document Attachment (Word, Excel, PowerPoint, Other) */
                <div className="flex flex-col items-center justify-center py-12 px-6 rounded-xl bg-slate-900 border border-slate-800 text-white">
                  <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <FileText className="h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">
                    {resource.title || "Document Resource"}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {typeUpper} document files are best read locally.
                  </p>

                  {resource.fileSize && (
                    <span className="mt-1 text-xs text-slate-500 font-semibold bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                      {(resource.fileSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}

                  <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-sm justify-center">
                    <a
                      href={resolvedUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6d3eeb] px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-purple-700 hover:scale-[1.02] transition-all"
                    >
                      <Download size={16} /> Download Document
                    </a>
                    <a
                      href={resolvedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-all"
                    >
                      <ExternalLink size={16} /> Open in Browser
                    </a>
                  </div>
                </div>
              )}
            </div>
          </StudentCard>
        </div>

        {/* Curriculum Alignment & Context Sidebar */}
        <div className="space-y-6">
          <StudentCard className="border border-slate-100 shadow-xl rounded-2xl bg-white p-5 space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Layers size={18} className="text-[#6d3eeb]" />
              Curriculum Link
            </h2>

            <div className="space-y-4">
              {resource.subject ? (
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase">
                      Subject
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {resource.subject.name}
                    </span>
                  </div>
                </div>
              ) : resource.subjectName ? (
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase">
                      Subject
                    </span>
                    <span className="text-sm font-bold text-slate-800">{resource.subjectName}</span>
                  </div>
                </div>
              ) : null}

              {resource.class ? (
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                    <Award size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase">
                      Class Enrolled
                    </span>
                    <span className="text-sm font-bold text-slate-800">{resource.class.name}</span>
                  </div>
                </div>
              ) : resource.className ? (
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                    <Award size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase">
                      Class Enrolled
                    </span>
                    <span className="text-sm font-bold text-slate-800">{resource.className}</span>
                  </div>
                </div>
              ) : null}

              {resource.course && (
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <Layers size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase">
                      Linked Course
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {resource.course.title}
                    </span>
                  </div>
                </div>
              )}

              {resource.lesson && (
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <FileText size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase">
                      Aligned Lesson
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {resource.lesson.title}
                    </span>
                  </div>
                </div>
              )}

              {resource.topic && (
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                    <Tag size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase">
                      Topic Category
                    </span>
                    <span className="text-sm font-bold text-slate-800">{resource.topic}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Calendar size={14} />
                <span>
                  Uploaded: {new Intl.DateTimeFormat("en-GB").format(new Date(resource.createdAt))}
                </span>
              </div>
              {resource.owner?.name && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold uppercase text-[10px]">
                    {resource.owner.name.slice(0, 2)}
                  </div>
                  <span>By: {resource.owner.name}</span>
                </div>
              )}
            </div>
          </StudentCard>

          {/* Tags cloud */}
          {resource.tags && resource.tags.length > 0 && (
            <StudentCard className="border border-slate-100 shadow-xl rounded-2xl bg-white p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide text-slate-500">
                Resource Tags
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {resource.tags.map((t: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600 border border-slate-100"
                  >
                    <Tag size={10} />
                    {t}
                  </span>
                ))}
              </div>
            </StudentCard>
          )}
        </div>
      </div>
    </div>
  );
}
