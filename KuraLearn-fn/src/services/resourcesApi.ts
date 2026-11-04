import { apiRequest } from "@/lib/api";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

export type ResourceParams = {
  search?: string;
  classId?: string;
  subjectId?: string;
  courseId?: string;
  lessonId?: string;
  type?: string;
  page?: number;
  limit?: number;
};

export type ResourceItem = {
  id: string;
  title: string;
  description?: string;
  type: string;
  fileSize?: number;
  fileUrl: string;
  storageProvider?: string;
  storagePath?: string;
  classId?: string;
  subjectId?: string;
  courseId?: string;
  lessonId?: string;
  className?: string;
  subjectName?: string;
  topic?: string;
  tags: string[];
  sharedScope: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  class?: { id: string; name: string };
  subject?: { id: string; name: string };
  course?: { id: string; title: string };
  lesson?: { id: string; title: string };
  owner?: { id: string; name: string; role: string };
};

export type FolderNode = {
  id: string;
  name: string;
  type: "class" | "subject" | "course" | "lesson";
  children?: FolderNode[];
  resourceCount: number;
};

function buildQueryString(params: ResourceParams = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const resourcesApi = {
  list: (params?: ResourceParams) =>
    apiRequest<{ items: ResourceItem[]; meta: any }>(`/resources${buildQueryString(params)}`),

  getFolders: () => apiRequest<FolderNode[]>("/resources/folders"),

  get: (id: string) => apiRequest<ResourceItem>(`/resources/${id}`),

  update: (id: string, payload: Partial<ResourceItem>) =>
    apiRequest<ResourceItem>(`/resources/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiRequest<{ success: boolean }>(`/resources/${id}`, {
      method: "DELETE",
    }),

  upload: (
    formData: FormData,
    onProgress: (progressPercentage: number) => void,
  ): Promise<ResourceItem> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${apiUrl}/resources/upload`, true);

      const token = localStorage.getItem("kuralearn_token");
      if (token && token !== "undefined" && token !== "null") {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText) as ResourceItem;
            resolve(data);
          } catch (err) {
            reject(new Error("Failed to parse server upload response."));
          }
        } else {
          try {
            const errBody = JSON.parse(xhr.responseText);
            reject(
              new Error(errBody.error?.message || errBody.message || "Failed to upload file."),
            );
          } catch {
            reject(new Error(`Upload failed with status code: ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network connection error during resource upload."));
      };

      xhr.send(formData);
    });
  },
};
