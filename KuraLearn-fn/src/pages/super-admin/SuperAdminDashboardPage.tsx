import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bot,
  GraduationCap,
  type LucideIcon,
  School,
  UserCheck,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  DashboardPageLayout,
  DashboardPanel,
  DashboardStatGrid,
} from "@/components/dashboard/DashboardLayout";
import { ModernTable } from "@/components/common/ModernTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  DashboardSkeleton,
  InlineEmptyState,
  InlineErrorState,
} from "@/pages/teacher/teacherShared";
import {
  type PlatformOverview,
  type PlatformSchool,
  superAdminApi,
} from "@/services/superAdminApi";
import { formatDateTime, readable, SUBSCRIPTION_OPTIONS } from "./format";

const number = new Intl.NumberFormat("en-GB");

function countFor(
  rows: Array<{ count: number } & Record<string, unknown>>,
  key: string,
  value: string,
) {
  return rows.find((row) => row[key] === value)?.count ?? 0;
}

function StatTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-purple-50 text-[#6d3eeb]">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-tight text-slate-900">{value}</p>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="truncate text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function ViewAll({ to }: { to: string }) {
  return (
    <Link to={to} className="text-sm font-bold text-[#6d3eeb]">
      View all
    </Link>
  );
}

function UsersByRole({ users }: { users: PlatformOverview["users"] }) {
  const largest = Math.max(1, ...users.byRole.map((row) => row.count));
  return (
    <ul className="space-y-3">
      {users.byRole.map((row) => (
        <li key={row.role} className="grid grid-cols-[9.5rem_1fr_3rem] items-center gap-3 text-sm">
          <span className="truncate font-semibold text-slate-700">{readable(row.role)}</span>
          <span className="h-3 rounded-r bg-slate-100">
            <span
              className="block h-3 rounded-r bg-[#6d3eeb]"
              style={{ width: `${(row.count / largest) * 100}%` }}
            />
          </span>
          <span className="text-right font-bold text-slate-900">{number.format(row.count)}</span>
        </li>
      ))}
    </ul>
  );
}

function Attention({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-800">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function Subscriptions({ schools }: { schools: PlatformOverview["schools"] }) {
  const pastDue = countFor(schools.byStatus, "status", "PAST_DUE");
  return (
    <>
      <ul className="divide-y divide-slate-100">
        {SUBSCRIPTION_OPTIONS.map((status) => (
          <li key={status} className="flex items-center justify-between py-2.5">
            <StatusBadge value={readable(status)} />
            <span className="text-sm font-bold text-slate-900">
              {number.format(countFor(schools.byStatus, "status", status))}
            </span>
          </li>
        ))}
      </ul>
      {pastDue > 0 ? (
        <Attention>
          {pastDue} {pastDue === 1 ? "school has" : "schools have"} a payment past due.
        </Attention>
      ) : null}
    </>
  );
}

function AccountHealth({ overview }: { overview: PlatformOverview }) {
  const pending = countFor(overview.users.byStatus, "status", "PENDING");
  const suspended = countFor(overview.users.byStatus, "status", "SUSPENDED");
  const { aiUsage } = overview;
  const rows = [
    { label: "Accounts not yet activated", value: number.format(pending) },
    { label: "Suspended accounts", value: number.format(suspended) },
    {
      label: `AI requests, last ${overview.activeWindowDays} days`,
      value: number.format(aiUsage.requests),
    },
    { label: "AI tokens used", value: number.format(aiUsage.tokens) },
    { label: "Estimated AI cost", value: `$${aiUsage.estimatedCost.toFixed(2)}` },
  ];
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((row) => (
        <li key={row.label} className="flex items-center justify-between gap-4 py-2.5 text-sm">
          <span className="text-slate-600">{row.label}</span>
          <span className="font-bold text-slate-900">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function SuperAdminDashboardPage() {
  const overview = useQuery({
    queryKey: ["super-admin", "overview"],
    queryFn: superAdminApi.overview,
  });

  if (overview.isLoading) {
    return (
      <DashboardPageLayout title="Platform overview" subtitle="All schools on KuraLearn.">
        <DashboardSkeleton />
      </DashboardPageLayout>
    );
  }
  if (overview.error || !overview.data) {
    return (
      <DashboardPageLayout title="Platform overview" subtitle="All schools on KuraLearn.">
        <InlineErrorState
          message={(overview.error as Error | null)?.message ?? "The overview could not be loaded."}
          onRetry={() => overview.refetch()}
        />
      </DashboardPageLayout>
    );
  }

  const data = overview.data;
  const learners = countFor(data.users.byRole, "role", "STUDENT");
  const parents = countFor(data.users.byRole, "role", "PARENT");
  const activeSchools = countFor(data.schools.byStatus, "status", "ACTIVE");
  const trialSchools = countFor(data.schools.byStatus, "status", "TRIAL");
  const staff = data.users.total - learners - parents;
  const activeShare = data.users.total
    ? Math.round((data.users.active / data.users.total) * 100)
    : 0;

  return (
    <DashboardPageLayout title="Platform overview" subtitle="All schools on KuraLearn.">
      <DashboardStatGrid columns="four">
        <StatTile
          icon={School}
          label="Schools"
          value={number.format(data.schools.total)}
          detail={`${activeSchools} active, ${trialSchools} on trial`}
        />
        <StatTile
          icon={GraduationCap}
          label="Learners"
          value={number.format(learners)}
          detail={`In ${number.format(data.classes)} classes`}
        />
        <StatTile
          icon={Users}
          label="Staff and parents"
          value={number.format(staff + parents)}
          detail={`${number.format(staff)} staff, ${number.format(parents)} parents`}
        />
        <StatTile
          icon={UserCheck}
          label="Recent sign-ins"
          value={number.format(data.users.active)}
          detail={`${activeShare}% of users, last ${data.activeWindowDays} days`}
        />
      </DashboardStatGrid>

      <div className="grid gap-5 xl:grid-cols-3 [&>*]:min-w-0">
        <DashboardPanel
          title="Users by role"
          action={<ViewAll to="/super-admin/users" />}
          bodyClassName="p-4"
        >
          <UsersByRole users={data.users} />
        </DashboardPanel>
        <DashboardPanel
          title="Subscriptions"
          action={<ViewAll to="/super-admin/schools" />}
          bodyClassName="p-4"
        >
          <Subscriptions schools={data.schools} />
        </DashboardPanel>
        <DashboardPanel
          title={
            <span className="flex items-center gap-2">
              <Bot size={16} className="text-slate-500" /> Accounts and AI usage
            </span>
          }
          bodyClassName="p-4"
        >
          <AccountHealth overview={data} />
        </DashboardPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
        <DashboardPanel
          title="Schools"
          action={<ViewAll to="/super-admin/schools" />}
          bodyClassName="p-4"
        >
          <ModernTable<PlatformSchool>
            data={data.schoolsPreview}
            emptyMessage="No schools have been added yet."
            columns={[
              { header: "School", accessor: "name" },
              { header: "Learners", accessor: "learners" },
              { header: "Teachers", accessor: "teachers" },
              {
                header: "Subscription",
                accessor: (row) => <StatusBadge value={readable(row.subscriptionStatus)} />,
              },
            ]}
          />
        </DashboardPanel>
        <DashboardPanel
          title="Recent activity"
          action={<ViewAll to="/super-admin/activity" />}
          bodyClassName="p-4"
        >
          {data.recentActivity.length ? (
            <ul className="divide-y divide-slate-100">
              {data.recentActivity.map((item) => (
                <li key={item.id} className="py-2.5 text-sm">
                  <p className="font-semibold text-slate-900">{readable(item.action)}</p>
                  <p className="text-xs text-slate-500">
                    {item.actorName ?? "System"}
                    {item.schoolName ? `, ${item.schoolName}` : ""} ·{" "}
                    {formatDateTime(item.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <InlineEmptyState message="No activity has been recorded yet." />
          )}
        </DashboardPanel>
      </div>
    </DashboardPageLayout>
  );
}
