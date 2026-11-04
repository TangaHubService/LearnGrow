import { apiRequest } from "../lib/api";

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: any;
  createdAt: string;
  user?: { name: string; email: string; role: string } | null;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditStats {
  totalLogs: number;
  recentActions: Array<{ action: string; entityType: string; createdAt: string }>;
  actionBreakdown: Array<{ action: string; count: number }>;
}

export const auditApi = {
  getLogs: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return apiRequest<AuditLogResponse>(`/audit/logs${query}`);
  },
  getStats: () => apiRequest<AuditStats>("/audit/stats"),
};
