import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, ClipboardList, GraduationCap, Users } from "lucide-react";
import type {
  ActivityItem,
  AnnouncementItem,
  AssessmentMetric,
  CalendarItem,
  SchoolAdminDashboardData,
  TaskItem,
} from "@/services/schoolAdminService";
import { ProgressDonut } from "./dashboardCharts";
import { Panel, QuickActions, ToneDot } from "./dashboardUi";

const examIcons = [ClipboardList, Users, GraduationCap, BookOpen];

export function CurriculumOverview({
  curriculum,
}: {
  curriculum: SchoolAdminDashboardData["curriculum"];
}) {
  return (
    <Panel title="Curriculum Progress">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <ProgressDonut percent={curriculum.completionPercent} />
        <dl className="flex-1 space-y-5 text-sm">
          <SummaryRow label="Subjects" value={String(curriculum.subjects)} />
          <SummaryRow label="Courses" value={String(curriculum.courses)} />
          <SummaryRow label="Lessons" value={String(curriculum.lessons)} />
          <SummaryRow
            label="Completed records"
            value={String(curriculum.completedLessons)}
            className="text-emerald-700"
          />
        </dl>
      </div>
      <Link
        to="/teacher/reports"
        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-100 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-50"
      >
        View Curriculum Reports
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </Panel>
  );
}

function SummaryRow({
  label,
  value,
  className = "text-[#0b1f4d]",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className={`font-bold ${className}`}>{value}</dd>
    </div>
  );
}

export function TopClasses({ classes }: { classes: SchoolAdminDashboardData["topClasses"] }) {
  return (
    <Panel title="Top Performing Classes">
      <div className="space-y-4">
        {classes.length ? (
          classes.map((item) => (
            <div
              key={item.rank}
              className="grid grid-cols-[24px_1fr_auto] items-center gap-3 text-sm"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-50 text-[10px] font-bold text-slate-500 ring-1 ring-slate-100">
                {item.rank}
              </span>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-bold text-slate-900">{item.name}</p>
                  <p className="shrink-0 text-[11px] font-semibold text-slate-500">
                    Avg: {item.average}%
                  </p>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${item.average}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyText>No performance records yet.</EmptyText>
        )}
      </div>
    </Panel>
  );
}

export function RecentActivities({ items }: { items: ActivityItem[] }) {
  return (
    <Panel title="Recent Activities">
      <div className="divide-y divide-slate-100">
        {items.length ? (
          items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[28px_1fr_auto_8px] items-start gap-4 py-3 first:pt-0 last:pb-0"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <Users size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{item.detail}</p>
              </div>
              <p className="whitespace-nowrap text-[11px] font-semibold text-slate-500">
                {item.time}
              </p>
              <span className="mt-2">
                <ToneDot tone={item.tone} />
              </span>
            </div>
          ))
        ) : (
          <EmptyText>No recent admin activity yet.</EmptyText>
        )}
      </div>
    </Panel>
  );
}

export function AssessmentOverview({ assessments }: { assessments: AssessmentMetric[] }) {
  return (
    <Panel title="Assessment Overview">
      <div className="grid gap-4 sm:grid-cols-2">
        {assessments.map((exam, index) => {
          const Icon = examIcons[index % examIcons.length] ?? ClipboardList;
          return (
            <div
              key={exam.label}
              className="flex items-center gap-4 rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50/50"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700">
                <Icon size={18} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {exam.label}
                </p>
                <p className="mt-0.5 text-lg font-bold text-slate-900">{exam.value}</p>
                <p className="text-[10px] font-semibold text-slate-500">{exam.suffix}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export function RightRail({ data }: { data: SchoolAdminDashboardData }) {
  return (
    <aside className="space-y-4">
      <Panel title="Quick Actions">
        <QuickActions actions={data.quickActions} />
      </Panel>
      <Panel title="School Notices" action={<RailLink to="/notifications">View All</RailLink>}>
        <AnnouncementList items={data.announcements} />
      </Panel>
      <Panel
        title="Academic Calendar"
        action={<RailLink to="/teacher/calendar">View Calendar</RailLink>}
      >
        <CalendarList items={data.calendar} />
      </Panel>
      <Panel title="Needs Attention">
        <TaskList items={data.tasks} />
      </Panel>
    </aside>
  );
}

function RailLink({ children, to }: { children: string; to: string }) {
  return (
    <Link to={to} className="text-sm font-bold text-blue-600 hover:text-blue-700">
      {children}
    </Link>
  );
}

function AnnouncementList({ items }: { items: AnnouncementItem[] }) {
  return (
    <div className="divide-y divide-slate-100">
      {items.map((item) => (
        <div
          key={item.id}
          className="grid grid-cols-[36px_1fr_8px] items-center gap-3 py-3 first:pt-0 last:pb-0"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
            <ClipboardList size={16} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{item.title}</p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">{item.date}</p>
          </div>
          <ToneDot tone={item.tone} />
        </div>
      ))}
      {!items.length ? <EmptyText>No school notices yet.</EmptyText> : null}
    </div>
  );
}

function CalendarList({ items }: { items: CalendarItem[] }) {
  return (
    <div className="divide-y divide-slate-100">
      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-[44px_1fr] gap-4 py-3 first:pt-0 last:pb-0">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-center text-blue-600">
            <div>
              <p className="text-base font-bold leading-none">{item.day}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase leading-none">{item.month}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{item.title}</p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">{item.detail}</p>
          </div>
        </div>
      ))}
      {!items.length ? <EmptyText>No scheduled lessons or assessments yet.</EmptyText> : null}
    </div>
  );
}

function EmptyText({ children }: { children: string }) {
  return <p className="py-4 text-sm font-bold text-slate-500">{children}</p>;
}

const TASK_LINKS: Record<string, string> = {
  "lesson-plans": "/teacher/lesson-plans",
  interventions: "/teacher/learners",
  "ai-insights": "/school-admin#ai",
  messages: "/teacher/messages",
};

function TaskList({ items }: { items: TaskItem[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to={TASK_LINKS[item.id] ?? "/school-admin"}
            className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <span className="min-w-0 flex-1 truncate">{item.title}</span>
            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
              {item.badge}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
