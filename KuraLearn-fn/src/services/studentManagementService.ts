import { apiRequest } from "@/lib/api";

export type ParentInfo = {
  name: string;
  phone?: string;
  email?: string;
  nationalId?: string;
  occupation?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  relationship?: string;
  isEmergencyContact?: boolean;
};

export type StudentRegistrationPayload = {
  name: string;
  email?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  nationality?: string;
  nationalId?: string;
  birthCertificateNumber?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  stream?: string;
  admissionDate?: string;
  previousSchool?: string;
  boardingStatus?: string;
  hasDisability?: boolean;
  disabilityType?: string;
  specialSupportNeeds?: string;
  medicalNotes?: string;
  inclusiveEducationNotes?: string;
  levelId: string;
  classId?: string;
  schoolId?: string;
  parentsInfo: ParentInfo[];
};

export const studentManagementApi = {
  register: (data: StudentRegistrationPayload) =>
    apiRequest<{ success: boolean; data: any }>("/student-management/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  linkLearner: (data: { email: string; classId: string }) =>
    apiRequest<{ success: boolean; data: { name: string; className: string } }>(
      "/student-management/link-learner",
      { method: "POST", body: JSON.stringify(data) },
    ),

  linkParent: (studentId: string, data: { email: string; relationship: string }) =>
    apiRequest<{ success: boolean; data: { name: string } }>(
      `/student-management/${studentId}/parents`,
      { method: "POST", body: JSON.stringify(data) },
    ),

  unlinkParent: (studentId: string, parentId: string) =>
    apiRequest<{ success: boolean }>(`/student-management/${studentId}/parents/${parentId}`, {
      method: "DELETE",
    }),

  list: (params?: Record<string, any>) => {
    const query = new URLSearchParams(params || {}).toString();
    const url = query ? `/student-management?${query}` : "/student-management";
    return apiRequest<{
      success: boolean;
      data: any[];
      pagination: { page: number; limit: number; totalRecords: number; totalPages: number };
      stats: {
        totalStudents: number;
        maleStudents: number;
        femaleStudents: number;
        studentsWithDisability: number;
        maleWithDisability: number;
        femaleWithDisability: number;
      };
    }>(url);
  },

  getDetails: (id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/student-management/${id}/details`),

  update: (id: string, data: any) =>
    apiRequest<{ success: boolean; data: any }>(`/student-management/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  archive: (id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/student-management/${id}/archive`, {
      method: "PATCH",
    }),

  delete: (id: string) =>
    apiRequest<{ success: boolean; data: any }>(`/student-management/${id}`, {
      method: "DELETE",
    }),
};
