import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { type PlatformSchool, superAdminApi } from "@/services/superAdminApi";
import { AddSchoolDrawer } from "./AddSchoolDrawer";
import { readable, SUBSCRIPTION_OPTIONS } from "./format";
import { PlatformTablePage } from "./PlatformTablePage";
import { useSuperAdminAction } from "./useSuperAdminAction";

const BLOCKING_STATUSES = ["PAST_DUE", "CANCELLED"];

type PendingChange = { school: PlatformSchool; status: string };

export function SuperAdminSchoolsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [pending, setPending] = useState<PendingChange | null>(null);

  const update = useSuperAdminAction(
    ({ school, status }: PendingChange) => superAdminApi.updateSubscription(school.id, status),
    ({ school, status }) => `${school.name} is now ${readable(status).toLowerCase()}.`,
  );

  const blocksAccess = pending ? BLOCKING_STATUSES.includes(pending.status) : false;

  return (
    <>
      <PlatformTablePage<PlatformSchool>
        title="Schools"
        subtitle="Every school on KuraLearn, with its size and subscription."
        panelTitle="All schools"
        queryKey="schools"
        fetchPage={superAdminApi.schools}
        searchPlaceholder="Search by school or district"
        itemLabel="schools"
        emptyMessage="No schools match this search."
        filters={[{ key: "status", label: "Subscriptions", options: SUBSCRIPTION_OPTIONS }]}
        action={
          <Button onClick={() => setAddOpen(true)}>
            <span className="flex items-center gap-1.5">
              <Plus size={16} /> Add school
            </span>
          </Button>
        }
        columns={[
          {
            header: "School",
            accessor: (row) => (
              <div>
                <span className="block font-semibold text-slate-900">{row.name}</span>
                <span className="text-xs text-slate-500">{readable(row.type)}</span>
              </div>
            ),
          },
          {
            header: "Location",
            accessor: (row) =>
              [row.district, row.province].filter(Boolean).join(", ") || "Not provided",
          },
          { header: "Learners", accessor: "learners" },
          { header: "Teachers", accessor: "teachers" },
          { header: "Classes", accessor: "classes" },
          {
            header: "Subscription",
            accessor: (row) => (
              <select
                aria-label={`Subscription for ${row.name}`}
                value={row.subscriptionStatus}
                onChange={(event) => setPending({ school: row, status: event.target.value })}
                className="custom-select h-9 rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700"
              >
                {SUBSCRIPTION_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {readable(status)}
                  </option>
                ))}
              </select>
            ),
          },
          { header: "Contact", accessor: (row) => row.email ?? row.phone ?? "Not provided" },
        ]}
      />

      <AddSchoolDrawer open={addOpen} onClose={() => setAddOpen(false)} />

      <ConfirmModal
        open={pending !== null}
        title="Change subscription?"
        message={
          pending
            ? `${pending.school.name} will change to ${readable(pending.status).toLowerCase()}.${
                blocksAccess ? " Its staff and learners will lose access to school pages." : ""
              }`
            : undefined
        }
        confirmLabel="Change subscription"
        danger={blocksAccess}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) update.mutate(pending);
          setPending(null);
        }}
      />
    </>
  );
}
