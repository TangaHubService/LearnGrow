import { useState } from "react";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { type PlatformUser, superAdminApi } from "@/services/superAdminApi";
import { formatDateTime, readable, ROLE_OPTIONS, USER_STATUS_OPTIONS } from "./format";
import { PlatformTablePage } from "./PlatformTablePage";
import { useSuperAdminAction } from "./useSuperAdminAction";

export function SuperAdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [target, setTarget] = useState<PlatformUser | null>(null);

  const suspending = target?.status !== "SUSPENDED";
  const update = useSuperAdminAction(
    ({ user, status }: { user: PlatformUser; status: string }) =>
      superAdminApi.updateUserStatus(user.id, status),
    ({ user, status }) =>
      `${user.name} was ${status === "SUSPENDED" ? "suspended" : "reactivated"}.`,
  );

  return (
    <>
      <PlatformTablePage<PlatformUser>
        title="Users"
        subtitle="Everyone with a KuraLearn account, across all schools."
        panelTitle="All users"
        queryKey="users"
        fetchPage={superAdminApi.users}
        searchPlaceholder="Search by name or email"
        itemLabel="users"
        emptyMessage="No users match this search."
        filters={[
          { key: "role", label: "Roles", options: ROLE_OPTIONS },
          { key: "status", label: "Statuses", options: USER_STATUS_OPTIONS },
        ]}
        columns={[
          {
            header: "Name",
            accessor: (row) => (
              <div>
                <span className="block font-semibold text-slate-900">{row.name}</span>
                <span className="text-xs text-slate-500">{row.email}</span>
              </div>
            ),
          },
          { header: "Role", accessor: (row) => readable(row.role) },
          { header: "School", accessor: (row) => row.schoolName ?? "None" },
          { header: "Status", accessor: (row) => <StatusBadge value={readable(row.status)} /> },
          { header: "Last sign-in", accessor: (row) => formatDateTime(row.lastLoginAt) },
          {
            header: "Action",
            accessor: (row) =>
              row.id === currentUser?.id ? (
                <span className="text-xs text-slate-500">Your account</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setTarget(row)}
                  className={`text-xs font-bold ${
                    row.status === "SUSPENDED" ? "text-[#6d3eeb]" : "text-red-600"
                  }`}
                >
                  {row.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                </button>
              ),
          },
        ]}
      />

      <ConfirmModal
        open={target !== null}
        title={suspending ? "Suspend this user?" : "Reactivate this user?"}
        message={
          target
            ? suspending
              ? `${target.name} will not be able to sign in. If they are signed in now, they can keep working for up to 30 minutes.`
              : `${target.name} will be able to sign in again.`
            : undefined
        }
        confirmLabel={suspending ? "Suspend" : "Reactivate"}
        danger={suspending}
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          if (target) {
            update.mutate({ user: target, status: suspending ? "SUSPENDED" : "ACTIVE" });
          }
          setTarget(null);
        }}
      />
    </>
  );
}
