import { DashboardPageLayout, DashboardPanel } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { readable } from "./format";

export function SuperAdminProfilePage() {
  const { user } = useAuth();
  const rows = [
    {
      label: "Name",
      value: user?.name ?? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim(),
    },
    { label: "Email", value: user?.email },
    { label: "Role", value: readable(user?.role) },
    { label: "Access", value: "All schools on KuraLearn" },
  ];

  return (
    <DashboardPageLayout title="Profile" subtitle="Your KuraLearn account.">
      <DashboardPanel title="Account details" bodyClassName="p-4">
        <dl className="max-w-xl divide-y divide-slate-100">
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[8rem_1fr] gap-4 py-3 text-sm">
              <dt className="text-slate-500">{row.label}</dt>
              <dd className="font-semibold text-slate-900">{row.value || "Not provided"}</dd>
            </div>
          ))}
        </dl>
      </DashboardPanel>
    </DashboardPageLayout>
  );
}
