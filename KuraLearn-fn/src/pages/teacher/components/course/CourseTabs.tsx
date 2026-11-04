import { Layers, BarChart3, Eye } from "lucide-react";

export type CourseTab = "content" | "analytics" | "details";

export function CourseTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: CourseTab;
  onTabChange: (tab: CourseTab) => void;
}) {
  const tabs = [
    { key: "content" as const, label: "Content", icon: Layers },
    { key: "analytics" as const, label: "Analytics", icon: BarChart3 },
    { key: "details" as const, label: "Details", icon: Eye },
  ];

  return (
    <div className="mb-5 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${
            activeTab === tab.key
              ? "bg-white text-[#6d3eeb] shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <tab.icon size={15} /> {tab.label}
        </button>
      ))}
    </div>
  );
}
