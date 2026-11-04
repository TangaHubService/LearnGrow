import { apiRequest } from "@/lib/api";

// ─── Type definitions ────────────────────────────────────────────────────────

export type StaffRole =
  | "HEADTEACHER"
  | "SCHOOL_ADMIN"
  | "TEACHER"
  | "ACCOUNTANT"
  | "DISCIPLINE_OFFICER"
  | "LIBRARIAN"
  | "ICT_OFFICER"
  | "RECEPTIONIST"
  | "SUPPORT_STAFF";

export type EmploymentStatus = "PERMANENT" | "CONTRACT" | "PART_TIME" | "INTERN" | "VOLUNTEER";

export type InvitationStatus = "PENDING" | "SENT" | "ACCEPTED" | "EXPIRED";

export type UserStatus = "ACTIVE" | "PENDING" | "SUSPENDED";

export type StaffListItem = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  gender: string | null;
  staffRole: StaffRole;
  employmentStatus: EmploymentStatus;
  status: UserStatus;
  invitationStatus: InvitationStatus;
  invitationSentAt: string | null;
  lastLoginAt: string | null;
  assignedClasses: string[];
  assignedSubjects: string[];
  assignmentCount: number;
};

export type StaffAssignment = {
  id: string;
  classId: string | null;
  className: string | null;
  subjectId: string | null;
  subjectName: string | null;
};

export type TeacherSummary = {
  assignedClassesCount: number;
  assignedSubjectsCount: number;
  lessonsCreated: number;
  marksSubmitted: number;
  marksApproved: number;
  resourcesUploaded: number;
  attendanceSessionsThisMonth: number;
};

export type StaffDetail = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  gender: string | null;
  staffRole: StaffRole;
  employmentStatus: EmploymentStatus;
  status: UserStatus;
  invitationStatus: InvitationStatus;
  invitationSentAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  invitedBy: { id: string; name: string } | null;
  assignments: StaffAssignment[];
  teacherSummary: TeacherSummary | null;
};

export type StaffAnalytics = {
  totalStaff: number;
  teachers: number;
  activeStaff: number;
  pendingInvitations: number;
  inactiveStaff: number;
  byRole: { role: StaffRole; count: number }[];
};

export type StaffListResponse = {
  data: StaffListItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};

export type CreateStaffPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  staffRole: StaffRole;
  employmentStatus: EmploymentStatus;
  classIds?: string[];
  subjectIds?: string[];
  sendInvitation: boolean;
};

export type UpdateStaffPayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  staffRole?: StaffRole;
  employmentStatus?: EmploymentStatus;
  status?: UserStatus;
};

export type AssignmentPayload = {
  assignments: {
    classId: string;
    subjectName: string;
    subjectId?: string;
  }[];
};

// ─── Helper ──────────────────────────────────────────────────────────────────

function buildQuery(
  params: Record<string, string | number | boolean | undefined | null> = {},
): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

// ─── Staff API client ─────────────────────────────────────────────────────────

export const staffApi = {
  /** Paginated staff list with filters */
  list: (params?: {
    search?: string;
    role?: StaffRole;
    status?: UserStatus;
    invitationStatus?: InvitationStatus;
    classId?: string;
    subjectId?: string;
    page?: number;
    pageSize?: number;
    sortBy?: "name" | "email" | "createdAt" | "staffRole";
    sortDir?: "asc" | "desc";
  }): Promise<StaffListResponse> => apiRequest(`/headteacher/staff${buildQuery(params)}`),

  /** Analytics summary cards */
  analytics: (): Promise<StaffAnalytics> => apiRequest("/headteacher/staff/analytics"),

  /** Full staff profile */
  get: (id: string): Promise<StaffDetail> => apiRequest(`/headteacher/staff/${id}`),

  /** Create a new staff member */
  create: (payload: CreateStaffPayload): Promise<{ id: string; name: string; email: string }> =>
    apiRequest("/headteacher/staff", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Update staff details */
  update: (id: string, payload: UpdateStaffPayload): Promise<{ success: boolean }> =>
    apiRequest(`/headteacher/staff/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  /** Send initial invitation email */
  invite: (id: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/headteacher/staff/${id}/invite`, { method: "POST" }),

  /** Resend invitation email */
  resendInvite: (id: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/headteacher/staff/${id}/resend-invite`, { method: "POST" }),

  /** Assign classes/subjects to a teacher */
  assignClasses: (
    id: string,
    payload: AssignmentPayload,
  ): Promise<{ success: boolean; created: number; skipped: number }> =>
    apiRequest(`/headteacher/staff/${id}/assignments`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Remove a class/subject assignment */
  removeAssignment: (staffId: string, assignmentId: string): Promise<{ success: boolean }> =>
    apiRequest(`/headteacher/staff/${staffId}/assignments/${assignmentId}`, {
      method: "DELETE",
    }),

  /** Activate or deactivate a staff member */
  updateStatus: (
    id: string,
    status: UserStatus,
  ): Promise<{ success: boolean; status: UserStatus }> =>
    apiRequest(`/headteacher/staff/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

// ─── Role display helpers ─────────────────────────────────────────────────────

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  HEADTEACHER: "Headteacher",
  SCHOOL_ADMIN: "School Admin",
  TEACHER: "Teacher",
  ACCOUNTANT: "Accountant",
  DISCIPLINE_OFFICER: "Discipline Officer",
  LIBRARIAN: "Librarian",
  ICT_OFFICER: "ICT Officer",
  RECEPTIONIST: "Receptionist",
  SUPPORT_STAFF: "Support Staff",
};

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  PERMANENT: "Permanent",
  CONTRACT: "Contract",
  PART_TIME: "Part Time",
  INTERN: "Intern",
  VOLUNTEER: "Volunteer",
};

export const INVITATION_STATUS_COLORS: Record<InvitationStatus, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  EXPIRED: "bg-red-100 text-red-700",
};
