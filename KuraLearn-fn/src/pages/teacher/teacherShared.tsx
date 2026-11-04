import { useState } from "react";
import type { ReactNode } from "react";
import { Filter, Search, Users } from "lucide-react";
import { CustomDropdown, StatusBadge } from "@/components/ModernUi";
import { DashboardPanel as SharedDashboardPanel } from "@/components/dashboard/DashboardLayout";
import { DashboardStatCard as CompactDashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import type { ListParams } from "@/services/lmsService";

// Re-export common components
export { Button } from "@/components/common/Button";
export { PageHeader } from "@/components/common/PageHeader";
export { ProgressBar } from "@/components/common/ProgressBar";
export { Skeleton, DashboardSkeleton } from "@/components/common/Skeleton";
export { Card } from "@/components/common/Card";
export {
  ErrorState,
  EmptyState,
  InlineEmptyState,
  InlineErrorState,
} from "@/components/common/States";

import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";

const purple = "#6d3eeb";
const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "ARCHIVED", label: "Archived" },
];
const sortOptions = [
  { value: "desc", label: "Newest" },
  { value: "asc", label: "Oldest" },
];
export const languageOptions = [
  { value: "en", label: "English" },
  { value: "rw", label: "Kinyarwanda" },
  { value: "fr", label: "French" },
];
export const resourceTypeOptions = [
  "PDF",
  "WORD",
  "POWERPOINT",
  "IMAGE",
  "VIDEO",
  "AUDIO",
  "LINK",
  "OTHER",
].map((type) => ({ value: type, label: type.replace("_", " ") }));
export const messageCategoryOptions = [
  { value: "GENERAL", label: "General" },
  { value: "ANNOUNCEMENT", label: "Announcement" },
  { value: "REMINDER", label: "Reminder" },
  { value: "PERFORMANCE_NOTE", label: "Performance Note" },
  { value: "HOMEWORK", label: "Homework" },
  { value: "EMERGENCY", label: "Emergency" },
];

export function SearchToolbar({
  params,
  setParams,
  placeholder = "Search",
  subjects,
}: {
  params: ListParams;
  setParams: (params: ListParams) => void;
  placeholder?: string;
  subjects?: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="mb-4">
      <div
        className={`grid gap-3 ${subjects ? "md:grid-cols-[1fr_180px_180px_160px_auto]" : "md:grid-cols-[1fr_180px_160px_auto]"}`}
      >
        <label className="flex h-10 items-center gap-2 rounded-lg border border-black px-3 bg-transparent transition-colors focus-within:border-black">
          <Search size={16} className="text-slate-500" />
          <input
            className="min-w-0 flex-1 text-sm font-medium text-slate-900 bg-transparent outline-none placeholder:text-slate-400"
            value={params.search ?? ""}
            onChange={(event) => setParams({ ...params, search: event.target.value, page: 1 })}
            placeholder={placeholder}
          />
        </label>
        {subjects && (
          <CustomDropdown
            value={params.subjectName}
            options={Array.from(new Set(subjects.map((sub) => sub.name))).map((name) => ({
              value: name,
              label: name,
            }))}
            placeholder="All subjects"
            className="border-black bg-transparent min-h-10"
            onChange={(subjectName) => setParams({ ...params, subjectName, page: 1 })}
          />
        )}
        <CustomDropdown
          value={params.status}
          options={statusOptions}
          placeholder="All statuses"
          className="border-black bg-transparent min-h-10"
          onChange={(status) => setParams({ ...params, status, page: 1 })}
        />
        <CustomDropdown
          value={params.sortDir ?? "desc"}
          options={sortOptions}
          placeholder="Sort"
          clearable={false}
          className="border-black bg-transparent min-h-10"
          onChange={(sortDir) =>
            setParams({ ...params, sortDir: (sortDir ?? "desc") as "asc" | "desc" })
          }
        />
        <Button
          variant="secondary"
          className="h-10 border-black bg-transparent hover:bg-slate-50 text-slate-900"
          onClick={() => setParams({ page: 1, pageSize: 12, sortDir: "desc", sortBy: "updatedAt" })}
        >
          <Filter size={15} /> Reset
        </Button>
      </div>
    </div>
  );
}

export function useListParams(): [ListParams, (params: ListParams) => void] {
  return useState<ListParams>({ page: 1, pageSize: 12, sortBy: "updatedAt", sortDir: "desc" });
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = purple,
  onClick,
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
  tone?: string;
  onClick?: () => void;
}) {
  return (
    <CompactDashboardStatCard
      label={label}
      value={value}
      icon={Icon}
      tone={tone}
      onClick={onClick}
    />
  );
}

export function DashboardPanel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SharedDashboardPanel title={title} action={action} className={className} bodyClassName="p-4">
      {children}
    </SharedDashboardPanel>
  );
}

export function DashboardStatusBadge({ status }: { status: string }) {
  return <StatusBadge value={status} />;
}

export function DashboardStatCard({
  label,
  value,
  caption,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  caption: string;
  icon: typeof Users;
  tone: string;
}) {
  return (
    <CompactDashboardStatCard
      label={label}
      value={value}
      caption={caption}
      icon={Icon}
      tone={tone}
    />
  );
}

export function displayDate(value?: string | Date | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function relativeTime(value?: string | Date | null) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function initials(name?: string) {
  return (name ?? "Teacher")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function StatusPill({ status }: { status: string }) {
  return <StatusBadge value={status} />;
}
