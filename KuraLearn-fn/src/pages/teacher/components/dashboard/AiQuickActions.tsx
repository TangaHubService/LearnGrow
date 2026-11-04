import {
  GraduationCap,
  ClipboardCheck,
  BookOpen,
  FileText,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { DashboardPanel } from "../../teacherShared";

export function AiQuickActions({ onOpenAi }: { onOpenAi: (kind: string, label: string) => void }) {
  const quickActions = [
    { label: "Prepare Lesson Plan", kind: "ai-lesson", icon: GraduationCap, tone: "#6d3eeb" },
    { label: "Generate Assessment", kind: "ai-quiz", icon: ClipboardCheck, tone: "#2563eb" },
    { label: "Create Homework", kind: "ai-homework", icon: BookOpen, tone: "#16a34a" },
    { label: "Create Activity", kind: "ai-activity", icon: FileText, tone: "#f97316" },
    { label: "Analyze Performance", kind: "ai-report", icon: BarChart3, tone: "#e85d8f" },
    { label: "Write Parent Message", kind: "ai-message", icon: MessageSquare, tone: "#0ea5e9" },
  ];

  return (
    <DashboardPanel title="AI Assistant - Quick Actions">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {quickActions.map((item) => (
          <button
            key={item.label}
            onClick={() => onOpenAi(item.kind, item.label)}
            className="min-h-28 rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
          >
            <span
              className="mx-auto grid h-10 w-10 place-items-center rounded-lg"
              style={{ backgroundColor: `${item.tone}16`, color: item.tone }}
            >
              <item.icon size={22} />
            </span>
            <span className="mt-3 block text-sm font-bold text-slate-800">{item.label}</span>
          </button>
        ))}
      </div>
    </DashboardPanel>
  );
}
