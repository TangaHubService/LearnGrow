import { apiRequest } from "@/lib/api";

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PlatformSchool = {
  id: string;
  name: string;
  district: string | null;
  province: string | null;
  type: string;
  subscriptionStatus: string;
  email: string | null;
  phone: string | null;
  learners: number;
  teachers: number;
  staff: number;
  classes: number;
};

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  schoolName: string | null;
};

export type PlatformActivity = {
  id: string;
  action: string;
  entityType: string;
  role: string | null;
  createdAt: string;
  actorName: string | null;
  schoolName: string | null;
};

export type PlatformOverview = {
  activeWindowDays: number;
  schools: { total: number; byStatus: Array<{ status: string; count: number }> };
  users: {
    total: number;
    active: number;
    byRole: Array<{ role: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
  };
  classes: number;
  aiUsage: { requests: number; tokens: number; estimatedCost: number };
  schoolsPreview: PlatformSchool[];
  recentActivity: PlatformActivity[];
};

export type PageParams = { page: number; pageSize: number; search?: string };

function withQuery(path: string, params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  return `${path}?${query.toString()}`;
}

export type NewSchoolInput = {
  name: string;
  type: string;
  district?: string;
  phone?: string;
  email?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
};

function sendJson<T>(path: string, method: "POST" | "PATCH", body: object) {
  return apiRequest<T>(path, { method, body: JSON.stringify(body) });
}

export const superAdminApi = {
  createSchool: (input: NewSchoolInput) =>
    sendJson<{ school: { id: string; name: string }; admin: { email: string } }>(
      "/admin/schools",
      "POST",
      input,
    ),
  updateSubscription: (schoolId: string, status: string) =>
    sendJson(`/super-admin/schools/${schoolId}/subscription`, "PATCH", { status }),
  updateUserStatus: (userId: string, status: string) =>
    sendJson(`/super-admin/users/${userId}/status`, "PATCH", { status }),
  overview: () => apiRequest<PlatformOverview>("/super-admin/overview"),
  schools: (params: PageParams & { status?: string }) =>
    apiRequest<Paged<PlatformSchool>>(withQuery("/super-admin/schools", params)),
  users: (params: PageParams & { role?: string; status?: string }) =>
    apiRequest<Paged<PlatformUser>>(withQuery("/super-admin/users", params)),
  activity: (params: PageParams) =>
    apiRequest<Paged<PlatformActivity>>(withQuery("/super-admin/activity", params)),
};
