import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  staffApi,
  STAFF_ROLE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  INVITATION_STATUS_COLORS,
  type StaffListItem,
  type StaffDetail,
  type StaffRole,
  type CreateStaffPayload,
  type UpdateStaffPayload,
  type AssignmentPayload,
} from "@/services/staffApi";
import { useTeacherReferenceData } from "@/pages/teacher/teacherReference";
import { Pagination } from "@/components/common/Pagination";
import { CustomDropdown } from "@/components/ModernUi";
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Shield,
  BookOpen,
  BarChart3,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  ChevronRight,
  Send,
  RefreshCw,
  UserCheck,
  UserX,
  Trash2,
  Plus,
  Briefcase,
  Edit3,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STAFF_ROLES: StaffRole[] = [
  "HEADTEACHER",
  "SCHOOL_ADMIN",
  "TEACHER",
  "ACCOUNTANT",
  "DISCIPLINE_OFFICER",
  "LIBRARIAN",
  "ICT_OFFICER",
  "RECEPTIONIST",
  "SUPPORT_STAFF",
];

const EMPLOYMENT_STATUSES = ["PERMANENT", "CONTRACT", "PART_TIME", "INTERN", "VOLUNTEER"] as const;

const staffRoleOptions = STAFF_ROLES.map((r) => ({
  value: r,
  label: STAFF_ROLE_LABELS[r] ?? r,
}));

const employmentStatusOptions = EMPLOYMENT_STATUSES.map((s) => ({
  value: s,
  label: EMPLOYMENT_STATUS_LABELS[s] ?? s,
}));

const genderOptions = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

// ─── Small shared UI helpers ─────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return <div className="py-12 text-center text-sm font-semibold text-slate-500">{message}</div>;
}

function ErrMsg({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm font-semibold text-red-600">
      <AlertTriangle className="h-4 w-4" /> {message}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "ACTIVE"
      ? "bg-green-100 text-green-700"
      : status === "SUSPENDED"
        ? "bg-red-100 text-red-700"
        : "bg-slate-100 text-slate-600";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}
    >
      {status}
    </span>
  );
}

function InviteBadge({ status }: { status: string }) {
  const cls =
    INVITATION_STATUS_COLORS[status as keyof typeof INVITATION_STATUS_COLORS] ??
    "bg-slate-100 text-slate-600";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}
    >
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: StaffRole }) {
  const colorMap: Record<string, string> = {
    TEACHER: "bg-blue-50 text-blue-700",
    HEADTEACHER: "bg-indigo-50 text-indigo-700",
    SCHOOL_ADMIN: "bg-purple-50 text-purple-700",
    ACCOUNTANT: "bg-yellow-50 text-yellow-700",
    DISCIPLINE_OFFICER: "bg-orange-50 text-orange-700",
    LIBRARIAN: "bg-teal-50 text-teal-700",
    ICT_OFFICER: "bg-cyan-50 text-cyan-700",
    RECEPTIONIST: "bg-pink-50 text-pink-700",
    SUPPORT_STAFF: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${colorMap[role] ?? "bg-slate-100 text-slate-600"}`}
    >
      {STAFF_ROLE_LABELS[role]}
    </span>
  );
}

function AnalyticsCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm bg-white flex flex-col gap-3 ${color}`}>
      <div className="flex items-center gap-3">
        <div className="rounded-xl p-2 bg-current/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-current" />
        </div>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
      </div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

// ─── Analytics cards row ──────────────────────────────────────────────────────

function AnalyticsRow() {
  const { data, isLoading } = useQuery({
    queryKey: ["staff-analytics"],
    queryFn: staffApi.analytics,
    staleTime: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
      <AnalyticsCard
        label="Total Staff"
        value={data.totalStaff}
        icon={Users}
        color="border-slate-200"
      />
      <AnalyticsCard
        label="Teachers"
        value={data.teachers}
        icon={BookOpen}
        color="border-blue-100"
      />
      <AnalyticsCard
        label="Active"
        value={data.activeStaff}
        icon={CheckCircle}
        color="border-green-100"
      />
      <AnalyticsCard
        label="Pending Invitations"
        value={data.pendingInvitations}
        icon={Clock}
        color="border-amber-100"
      />
      <AnalyticsCard
        label="Inactive"
        value={data.inactiveStaff}
        icon={UserX}
        color="border-red-100"
      />
    </div>
  );
}

// ─── Add Staff Drawer ─────────────────────────────────────────────────────────

function AddStaffDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const queryClient = useQueryClient();
  const { data: refData } = useTeacherReferenceData();

  const [form, setForm] = useState<
    Omit<CreateStaffPayload, "classIds" | "subjectIds"> & {
      classIds: string[];
      subjectIds: string[];
    }
  >({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: undefined,
    staffRole: "TEACHER",
    employmentStatus: "PERMANENT",
    sendInvitation: true,
    classIds: [],
    subjectIds: [],
  });

  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: CreateStaffPayload) => staffApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      queryClient.invalidateQueries({ queryKey: ["staff-analytics"] });
      onCreated();
    },
    onError: (err: Error) => setError(err.message),
  });

  const set = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleClass = (id: string) =>
    setForm((prev) => ({
      ...prev,
      classIds: prev.classIds.includes(id)
        ? prev.classIds.filter((c) => c !== id)
        : [...prev.classIds, id],
    }));

  const toggleSubject = (id: string) =>
    setForm((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(id)
        ? prev.subjectIds.filter((s) => s !== id)
        : [...prev.subjectIds, id],
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError("First name, last name and email are required.");
      return;
    }
    mutation.mutate({
      ...form,
      classIds: form.classIds.length > 0 ? form.classIds : undefined,
      subjectIds: form.subjectIds.length > 0 ? form.subjectIds : undefined,
    });
  };

  const isTeacher = form.staffRole === "TEACHER";
  const classes = refData?.classes ?? [];
  const subjects = refData?.subjects ?? [];

  const inputCls =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200 placeholder-slate-400";
  const labelCls = "block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm">
      <div className="h-full w-full max-w-xl bg-white shadow-lg overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Add New Staff Member</h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Fill in details and optionally send an invitation email.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 transition-colors"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 px-6 py-6 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>First Name *</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder="e.g. Jean"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Last Name *</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder="e.g. Uwimana"
                className={inputCls}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={labelCls}>Email Address *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="e.g. jean@school.rw"
              className={inputCls}
            />
          </div>

          {/* Phone */}
          <div>
            <label className={labelCls}>Phone Number</label>
            <input
              value={form.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="e.g. +250 788 000 000"
              className={inputCls}
            />
          </div>

          {/* Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Staff Role *</label>
              <CustomDropdown
                value={form.staffRole}
                onChange={(val) => set("staffRole", val)}
                options={staffRoleOptions}
                clearable={false}
              />
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <CustomDropdown
                value={form.gender ?? ""}
                onChange={(val) => set("gender", val || undefined)}
                options={genderOptions}
                placeholder="Not specified"
              />
            </div>
          </div>

          {/* Employment */}
          <div>
            <label className={labelCls}>Employment Status *</label>
            <CustomDropdown
              value={form.employmentStatus}
              onChange={(val) => set("employmentStatus", val)}
              options={employmentStatusOptions}
              clearable={false}
            />
          </div>

          {/* Classes/subjects (TEACHER only) */}
          {isTeacher && (
            <>
              {classes.length > 0 && (
                <div>
                  <label className={labelCls}>Assign Classes (optional)</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {classes.map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleClass(c.id)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                          form.classIds.includes(c.id)
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "border-slate-200 text-slate-600 hover:border-indigo-300"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {subjects.length > 0 && (
                <div>
                  <label className={labelCls}>Assign Subjects (optional)</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {subjects.map((s: any) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSubject(s.id)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                          form.subjectIds.includes(s.id)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-slate-200 text-slate-600 hover:border-blue-300"
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Send invitation toggle */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <button
              type="button"
              onClick={() => set("sendInvitation", !form.sendInvitation)}
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none ${form.sendInvitation ? "bg-indigo-600" : "bg-slate-300"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${form.sendInvitation ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
            <div>
              <p className="text-sm font-bold text-slate-800">Send Invitation Email</p>
              <p className="text-xs text-slate-500">
                Staff will receive a link to set their password
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              {mutation.isPending ? "Adding..." : "Add Staff Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Staff Drawer ────────────────────────────────────────────────────────

function EditStaffDrawer({
  staff,
  onClose,
  onUpdated,
}: {
  staff: StaffDetail;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const queryClient = useQueryClient();
  const nameParts = staff.name.split(" ");
  const [form, setForm] = useState<UpdateStaffPayload>({
    firstName: nameParts[0] ?? "",
    lastName: nameParts.slice(1).join(" "),
    phone: staff.phone ?? "",
    gender: (staff.gender as any) ?? undefined,
    staffRole: staff.staffRole,
    employmentStatus: staff.employmentStatus,
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: UpdateStaffPayload) => staffApi.update(staff.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      queryClient.invalidateQueries({ queryKey: ["staff-detail", staff.id] });
      onUpdated();
    },
    onError: (err: Error) => setError(err.message),
  });

  const set = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate(form);
  };

  const inputCls =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200 placeholder-slate-400";
  const labelCls = "block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm">
      <div className="h-full w-full max-w-lg bg-white shadow-lg overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Edit Staff Member</h3>
            <p className="text-sm text-slate-500 mt-0.5">{staff.name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 px-6 py-6 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>First Name</label>
              <input
                value={form.firstName ?? ""}
                onChange={(e) => set("firstName", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Last Name</label>
              <input
                value={form.lastName ?? ""}
                onChange={(e) => set("lastName", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Phone Number</label>
            <input
              value={form.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+250 788 000 000"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Staff Role</label>
              <CustomDropdown
                value={form.staffRole ?? ""}
                onChange={(val) => set("staffRole", val)}
                options={staffRoleOptions}
                clearable={false}
              />
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <CustomDropdown
                value={form.gender ?? ""}
                onChange={(val) => set("gender", val || undefined)}
                options={genderOptions}
                placeholder="Not specified"
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Employment Status</label>
            <CustomDropdown
              value={form.employmentStatus ?? ""}
              onChange={(val) => set("employmentStatus", val)}
              options={employmentStatusOptions}
              clearable={false}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Assign Classes Modal ─────────────────────────────────────────────────────

function AssignClassesModal({
  staffId,
  existingAssignments,
  onClose,
  onAssigned,
}: {
  staffId: string;
  existingAssignments: {
    classId: string | null;
    subjectId: string | null;
    subjectName: string | null;
  }[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: refData } = useTeacherReferenceData();
  const classes = refData?.classes ?? [];
  const subjects = refData?.subjects ?? [];

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedSubject = subjects.find((s: any) => s.id === selectedSubjectId);

  const classOptions = useMemo(() => {
    return classes.map((c: any) => ({
      value: c.id,
      label: c.name,
    }));
  }, [classes]);

  const subjectOptions = useMemo(() => {
    return subjects.map((s: any) => ({
      value: s.id,
      label: s.name,
    }));
  }, [subjects]);

  const mutation = useMutation({
    mutationFn: (payload: AssignmentPayload) => staffApi.assignClasses(staffId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-detail", staffId] });
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      onAssigned();
    },
    onError: (err: Error) => setError(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (assignmentId: string) => staffApi.removeAssignment(staffId, assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-detail", staffId] });
    },
  });

  const handleAdd = () => {
    setError(null);
    if (!selectedClassId || !selectedSubjectId) {
      setError("Please select both a class and a subject.");
      return;
    }
    mutation.mutate({
      assignments: [
        {
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          subjectName: selectedSubject?.name ?? selectedSubjectId,
        },
      ],
    });
    setSelectedClassId("");
    setSelectedSubjectId("");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-bold text-slate-900">Manage Assignments</h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        <div className="px-6 py-6 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                Class
              </label>
              <CustomDropdown
                value={selectedClassId}
                onChange={(val) => setSelectedClassId(val || "")}
                options={classOptions}
                placeholder="Select class..."
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                Subject
              </label>
              <CustomDropdown
                value={selectedSubjectId}
                onChange={(val) => setSelectedSubjectId(val || "")}
                options={subjectOptions}
                placeholder="Select subject..."
              />
            </div>
            <button
              aria-label="Add"
              type="button"
              onClick={handleAdd}
              disabled={mutation.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Current assignments */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
              Current Assignments
            </p>
            {existingAssignments.length === 0 ? (
              <Empty message="No assignments yet. Add one above." />
            ) : (
              <div className="space-y-2">
                {existingAssignments.map((a: any) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <span className="text-sm font-bold text-slate-800">
                        {a.className ?? a.classId}
                      </span>
                      {a.subjectName && (
                        <span className="ml-2 text-xs font-semibold text-slate-500">
                          · {a.subjectName}
                        </span>
                      )}
                    </div>
                    <button
                      aria-label="Delete"
                      onClick={() => removeMutation.mutate(a.id)}
                      disabled={removeMutation.isPending}
                      className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-100 px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Staff Profile Drawer ─────────────────────────────────────────────────────

function StaffProfileDrawer({
  staffId,
  onClose,
  onEdit,
  onAssign,
}: {
  staffId: string;
  onClose: () => void;
  onEdit: (staff: StaffDetail) => void;
  onAssign: (staff: StaffDetail) => void;
}) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["staff-detail", staffId],
    queryFn: () => staffApi.get(staffId),
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      data?.invitationStatus === "PENDING"
        ? staffApi.invite(staffId)
        : staffApi.resendInvite(staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-detail", staffId] });
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      queryClient.invalidateQueries({ queryKey: ["staff-analytics"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: "ACTIVE" | "SUSPENDED") => staffApi.updateStatus(staffId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-detail", staffId] });
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      queryClient.invalidateQueries({ queryKey: ["staff-analytics"] });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm">
      <div className="h-full w-full max-w-2xl bg-white shadow-lg overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-bold text-slate-900">Staff Profile</h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 px-6 py-6">
          {isLoading && <Spinner />}
          {isError && <ErrMsg message="Failed to load staff profile" />}

          {data && (
            <div className="space-y-6">
              {/* Hero card */}
              <div className="rounded-xl bg-indigo-600 p-6 text-white shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold mb-3">
                      {data.name[0]}
                    </div>
                    <h4 className="text-xl font-bold">{data.name}</h4>
                    <p className="text-sm font-semibold mt-0.5">{data.email}</p>
                    {data.phone && <p className="text-sm mt-0.5">{data.phone}</p>}
                  </div>
                  <div className="text-right space-y-2">
                    <div>
                      <RoleBadge role={data.staffRole} />
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          data.status === "ACTIVE"
                            ? "bg-green-500/20 text-green-200"
                            : "bg-red-500/20 text-red-200"
                        }`}
                      >
                        {data.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-white/10 text-xs font-bold">
                  <div>
                    EMPLOYMENT:{" "}
                    <span className="text-indigo-200">
                      {EMPLOYMENT_STATUS_LABELS[data.employmentStatus]}
                    </span>
                  </div>
                  {data.gender && (
                    <div>
                      GENDER: <span className="text-indigo-200">{data.gender}</span>
                    </div>
                  )}
                  <div>
                    INVITE: <span className="text-indigo-200">{data.invitationStatus}</span>
                  </div>
                  {data.lastLoginAt && (
                    <div>
                      LAST LOGIN:{" "}
                      <span className="text-indigo-200">
                        {new Date(data.lastLoginAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onEdit(data)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Edit3 className="h-4 w-4" /> Edit Details
                </button>

                {data.staffRole === "TEACHER" && (
                  <button
                    onClick={() => onAssign(data)}
                    className="flex items-center gap-1.5 rounded-lg border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50 transition-colors"
                  >
                    <BookOpen className="h-4 w-4" /> Assign Classes
                  </button>
                )}

                {data.invitationStatus !== "ACCEPTED" && data.status !== "SUSPENDED" && (
                  <button
                    onClick={() => inviteMutation.mutate()}
                    disabled={inviteMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg border border-indigo-200 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50 transition-colors disabled:opacity-60"
                  >
                    {inviteMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {data.invitationStatus === "PENDING" ? "Send Invitation" : "Resend Invitation"}
                  </button>
                )}

                {data.status === "ACTIVE" ? (
                  <button
                    onClick={() => statusMutation.mutate("SUSPENDED")}
                    disabled={statusMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 transition-colors disabled:opacity-60"
                  >
                    <UserX className="h-4 w-4" /> Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => statusMutation.mutate("ACTIVE")}
                    disabled={statusMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg border border-green-200 px-4 py-2 text-sm font-bold text-green-700 hover:bg-green-50 transition-colors disabled:opacity-60"
                  >
                    <UserCheck className="h-4 w-4" /> Activate
                  </button>
                )}
              </div>

              {/* Teacher Performance Summary */}
              {data.staffRole === "TEACHER" && data.teacherSummary && (
                <div>
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                    Teaching Performance
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Classes", value: data.teacherSummary.assignedClassesCount },
                      { label: "Lessons", value: data.teacherSummary.lessonsCreated },
                      { label: "Marks Submitted", value: data.teacherSummary.marksSubmitted },
                      { label: "Resources", value: data.teacherSummary.resourcesUploaded },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-center"
                      >
                        <p className="text-2xl font-bold text-slate-800">{value}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignments */}
              {data.assignments.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                    {data.staffRole === "TEACHER" ? "Assigned Classes & Subjects" : "Assignments"}
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {data.assignments.map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex flex-col rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs"
                      >
                        <span className="font-bold text-blue-900">{a.className ?? a.classId}</span>
                        {a.subjectName && (
                          <span className="font-semibold text-blue-700 mt-0.5">
                            {a.subjectName}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Info row */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4 space-y-2">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                  Record Details
                </h5>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  {data.invitedBy && (
                    <>
                      <span className="font-semibold text-slate-500">Invited by</span>
                      <span className="font-bold text-slate-800">{data.invitedBy.name}</span>
                    </>
                  )}
                  {data.invitationSentAt && (
                    <>
                      <span className="font-semibold text-slate-500">Invited on</span>
                      <span className="font-bold text-slate-800">
                        {new Date(data.invitationSentAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                  <span className="font-semibold text-slate-500">Added on</span>
                  <span className="font-bold text-slate-800">
                    {new Date(data.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Staff List Table ─────────────────────────────────────────────────────────

function StaffTable({
  items,
  onSelect,
}: {
  items: StaffListItem[];
  onSelect: (staff: StaffListItem) => void;
}) {
  if (items.length === 0)
    return <Empty message="No staff members found for the selected filters." />;

  return (
    <div tabIndex={0} className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/60">
            <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              Name
            </th>
            <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">
              Contact
            </th>
            <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              Role
            </th>
            <th className="py-3 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
              Classes
            </th>
            <th className="py-3 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">
              Status
            </th>
            <th className="py-3 px-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">
              Invitation
            </th>
            <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wide hidden xl:table-cell">
              Last Login
            </th>
            <th className="py-3 px-4" />
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr
              key={s.id}
              className="border-b border-slate-100 hover:bg-indigo-50/30 cursor-pointer transition-colors duration-150"
              onClick={() => onSelect(s)}
            >
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                    {s.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{s.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-3.5 px-4 hidden md:table-cell">
                {s.phone ? (
                  <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold">
                    <Phone className="h-3 w-3" /> {s.phone}
                  </div>
                ) : (
                  <span className="text-slate-300 text-xs">—</span>
                )}
              </td>
              <td className="py-3.5 px-4">
                <RoleBadge role={s.staffRole} />
              </td>
              <td className="py-3.5 px-4 text-center hidden lg:table-cell">
                {s.staffRole === "TEACHER" ? (
                  <span
                    className={`text-sm font-bold ${s.assignmentCount > 0 ? "text-blue-700" : "text-slate-300"}`}
                  >
                    {s.assignmentCount}
                  </span>
                ) : (
                  <span className="text-slate-300 text-xs">—</span>
                )}
              </td>
              <td className="py-3.5 px-4 text-center">
                <StatusBadge status={s.status} />
              </td>
              <td className="py-3.5 px-4 text-center">
                <InviteBadge status={s.invitationStatus} />
              </td>
              <td className="py-3.5 px-4 text-xs text-slate-500 font-medium hidden xl:table-cell">
                {s.lastLoginAt ? (
                  new Date(s.lastLoginAt).toLocaleDateString()
                ) : (
                  <span className="text-slate-300">Never</span>
                )}
              </td>
              <td className="py-3.5 px-4 text-right">
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type DrawerView = "none" | "add" | "profile" | "edit" | "assign";

export function StaffManagementPage() {
  const [view, setView] = useState<DrawerView>("none");
  const [selectedStaff, setSelectedStaff] = useState<StaffListItem | null>(null);
  const [profileData, setProfileData] = useState<StaffDetail | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<StaffRole | "">("");
  const [statusFilter, setStatusFilter] = useState("");
  const [inviteFilter, setInviteFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "staff-list",
      page,
      pageSize,
      debouncedSearch,
      roleFilter,
      statusFilter,
      inviteFilter,
    ],
    queryFn: () =>
      staffApi.list({
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        status: (statusFilter as any) || undefined,
        invitationStatus: (inviteFilter as any) || undefined,
        page,
        pageSize,
      }),
    placeholderData: (prev) => prev,
  });

  const items = data?.data ?? [];
  const pagination = data?.pagination;

  const openProfile = (s: StaffListItem) => {
    setSelectedStaff(s);
    setView("profile");
  };

  const closeAll = () => {
    setView("none");
    setSelectedStaff(null);
    setProfileData(null);
  };

  const selectCls =
    "rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:outline-none";

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0b1f4d]">Staff Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage all school staff — teachers, admin, support, and more.
          </p>
        </div>
        <button
          id="add-staff-btn"
          onClick={() => setView("add")}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-md"
        >
          <UserPlus className="h-4 w-4" /> Add Staff
        </button>
      </div>

      {/* Analytics row */}
      <AnalyticsRow />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <input
            id="staff-search"
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search name, email or phone…"
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm font-semibold focus:border-indigo-500 focus:outline-none placeholder-slate-400"
          />
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-48">
            <CustomDropdown
              value={roleFilter}
              onChange={(val) => {
                setRoleFilter((val || "") as any);
                setPage(1);
              }}
              placeholder="All Roles"
              clearable={true}
              options={STAFF_ROLES.map((r) => ({
                value: r,
                label: STAFF_ROLE_LABELS[r],
              }))}
            />
          </div>
          <div className="w-full sm:w-48">
            <CustomDropdown
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val || "");
                setPage(1);
              }}
              placeholder="All Statuses"
              clearable={true}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "PENDING", label: "Pending" },
                { value: "SUSPENDED", label: "Inactive" },
              ]}
            />
          </div>
          <div className="w-full sm:w-48">
            <CustomDropdown
              value={inviteFilter}
              onChange={(val) => {
                setInviteFilter(val || "");
                setPage(1);
              }}
              placeholder="All Invitations"
              clearable={true}
              options={[
                { value: "PENDING", label: "Invite Pending" },
                { value: "SENT", label: "Invite Sent" },
                { value: "ACCEPTED", label: "Accepted" },
                { value: "EXPIRED", label: "Expired" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table panel */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-bold text-slate-800">
            Staff Members
            {pagination && (
              <span className="ml-2 text-sm font-semibold text-slate-500">
                ({pagination.totalItems})
              </span>
            )}
          </h3>
          {isLoading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          )}
        </div>

        {isLoading && !data ? (
          <Spinner />
        ) : isError ? (
          <ErrMsg message="Failed to load staff list. Please retry." />
        ) : (
          <StaffTable items={items} onSelect={openProfile} />
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-5">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.totalItems}
              limit={pagination.limit}
              onChange={setPage}
              itemLabel="staff members"
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      {/* Drawers / Modals */}
      {view === "add" && <AddStaffDrawer onClose={closeAll} onCreated={closeAll} />}

      {view === "profile" && selectedStaff && (
        <StaffProfileDrawer
          staffId={selectedStaff.id}
          onClose={closeAll}
          onEdit={(detail) => {
            setProfileData(detail);
            setView("edit");
          }}
          onAssign={(detail) => {
            setProfileData(detail);
            setView("assign");
          }}
        />
      )}

      {view === "edit" && profileData && (
        <EditStaffDrawer staff={profileData} onClose={closeAll} onUpdated={closeAll} />
      )}

      {view === "assign" && profileData && (
        <AssignClassesModal
          staffId={profileData.id}
          existingAssignments={profileData.assignments}
          onClose={closeAll}
          onAssigned={() => {
            setView("profile");
          }}
        />
      )}
    </div>
  );
}
