import { syncManager } from "../offline/sync-manager";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
const accessTokenKey = "kuralearn_token";
const refreshTokenKey = "kuralearn_refresh_token";
const userKey = "kuralearn_user";

export type ApiUser = {
  id: string;
  name?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  roles: string[];
};

export type AuthResponse = {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
};

export type AiMessageRole = "USER" | "ASSISTANT" | "SYSTEM";

export type AiConversationMessage = {
  id: string;
  role: AiMessageRole;
  content: string;
  createdAt: string;
};

export type AiConversationSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AiConversationMessage[];
};

export type AiConversationDetail = AiConversationSummary & {
  messages: AiConversationMessage[];
};

export type AiChatPayload = {
  message: string;
  conversationId?: string;
  lessonId?: string;
  language?: "en" | "rw" | "fr";
};

export type AiChatResponse = {
  conversationId: string;
  reply: string;
  language: "en" | "rw" | "fr";
  suggestedActions?: Array<{ label: string; action: string; targetId?: string }>;
  practiceQuestion?: unknown;
};

let refreshPromise: Promise<AuthResponse> | null = null;

function token() {
  const t = localStorage.getItem(accessTokenKey);
  if (!t || t === "undefined" || t === "null") return undefined;
  return t;
}

function storedRefreshToken() {
  return localStorage.getItem(refreshTokenKey) ?? undefined;
}

function storeSession(result: AuthResponse) {
  if (!result.accessToken || !result.refreshToken) {
    console.error("[API] storeSession called with missing tokens", result);
    return;
  }
  localStorage.setItem(userKey, JSON.stringify(result.user));
  localStorage.setItem(accessTokenKey, result.accessToken);
  localStorage.setItem(refreshTokenKey, result.refreshToken);
  window.dispatchEvent(new CustomEvent("kuralearn-auth-refreshed", { detail: result.user }));
}

function clearSession() {
  localStorage.removeItem(userKey);
  localStorage.removeItem(accessTokenKey);
  localStorage.removeItem(refreshTokenKey);
  window.dispatchEvent(new Event("kuralearn-auth-cleared"));
}

async function refreshSession() {
  const refreshToken = storedRefreshToken();
  if (!refreshToken || token() === "demo-token") {
    throw new Error("Session expired. Please sign in again.");
  }

  refreshPromise ??= fetch(`${apiUrl}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Session expired. Please sign in again.");
      }
      const result = (await response.json()) as AuthResponse;
      storeSession(result);
      return result;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function parseApiError(response: Response) {
  const error = await response
    .json()
    .catch(() => ({ error: { message: `API request failed: ${response.status}` } }));
  return new Error(
    (typeof error.error === "string" ? error.error : error.error?.message) ??
      error.message ??
      `API request failed: ${response.status}`,
  );
}

async function sendRequest<T>(
  path: string,
  options: RequestInit,
  allowRefresh: boolean,
): Promise<T> {
  const accessToken = token();

  const headers = new Headers(options.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!navigator.onLine && options.method && options.method !== "GET") {
    const method = options.method as "POST" | "PUT" | "PATCH" | "DELETE";
    await syncManager.enqueue({
      action: `${method} ${path}`,
      endpoint: `${apiUrl}${path}`,
      method,
      body: options.body ? JSON.parse(options.body as string) : undefined,
    });
    throw new Error("QUEUED_OFFLINE");
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
  });

  if (
    response.status === 401 &&
    allowRefresh &&
    path !== "/auth/login" &&
    path !== "/auth/refresh"
  ) {
    try {
      console.log(`[API] 401 on ${path}, attempting refresh...`);
      await refreshSession();
      console.log(`[API] Refresh successful, retrying ${path}...`);
      return sendRequest<T>(path, options, false);
    } catch (error) {
      console.error(`[API] Refresh failed for ${path}:`, error);
      clearSession();
      throw error;
    }
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  return sendRequest<T>(path, options, true);
}

export const authApi = {
  login(email: string, password: string) {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  register(input: { name: string; email: string; password: string; role: string }) {
    return apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  forgotPassword(email: string) {
    return apiRequest<{ success: boolean }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  resetPassword(token: string, password: string) {
    return apiRequest<{ success: boolean }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  },
  me() {
    return apiRequest<{ user: ApiUser }>("/auth/me");
  },
  refresh() {
    return refreshSession();
  },
  logout() {
    return apiRequest<void>("/auth/logout", { method: "POST" });
  },
};

export const studentApi = {
  dashboard: () => apiRequest<any>("/students/me/dashboard"),
  subjects: () => apiRequest<any>("/students/me/subjects"),
  courses: (subjectId: string) => apiRequest<any>(`/subjects/${subjectId}/courses`),
  lesson: (lessonId: string) => apiRequest<any>(`/lessons/${lessonId}`),
  completeLesson: (lessonId: string) =>
    apiRequest<any>(`/lessons/${lessonId}/complete`, {
      method: "POST",
      body: JSON.stringify({ deviceType: "web" }),
    }),
  quiz: (quizId: string) => apiRequest<any>(`/quizzes/${quizId}`),
  submitQuiz: (quizId: string, answers: Record<string, unknown>, timeUsed: number) =>
    apiRequest<any>(`/quizzes/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers, timeUsed }),
    }),
  aiConversations: () =>
    apiRequest<{ conversations: AiConversationSummary[] }>("/ai/conversations"),
  aiConversation: (conversationId: string) =>
    apiRequest<{ conversation: AiConversationDetail }>(`/ai/conversations/${conversationId}`),
  aiChat: (payload: AiChatPayload | string, lessonId?: string) => {
    const body =
      typeof payload === "string"
        ? { message: payload, lessonId, language: "en" as const }
        : { ...payload, language: payload.language ?? ("en" as const) };
    return apiRequest<AiChatResponse>("/ai/chat", { method: "POST", body: JSON.stringify(body) });
  },
};

export const parentApi = {
  dashboard: () => apiRequest<any>("/parents/me/dashboard"),
};
