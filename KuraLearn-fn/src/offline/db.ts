import Dexie, { type Table } from "dexie";

export interface OfflineLesson {
  id: string;
  courseId: string;
  title: string;
  body: string;
  contentType: string;
  order: number;
  estimatedMinutes: number;
  cachedAt: number;
}

export interface OfflineAssignment {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  dueDate?: string;
  points: number;
  cachedAt: number;
}

export interface OfflineAttendanceEntry {
  id?: string;
  studentId: string;
  classId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  lessonId?: string;
  synced: boolean;
  createdAt: number;
}

export interface SyncQueueItem {
  id?: number;
  action: string;
  endpoint: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  createdAt: number;
  retryCount: number;
  maxRetries: number;
}

class KuraLearnDB extends Dexie {
  lessons!: Table<OfflineLesson, string>;
  assignments!: Table<OfflineAssignment, string>;
  attendance!: Table<OfflineAttendanceEntry, number | undefined>;
  syncQueue!: Table<SyncQueueItem, number | undefined>;

  constructor() {
    super("KuraLearnOffline");

    this.version(1).stores({
      lessons: "id, courseId, cachedAt",
      assignments: "id, courseId, cachedAt",
      attendance: "++id, studentId, classId, date, synced",
      syncQueue: "++id, createdAt, retryCount",
    });
  }
}

export const db = new KuraLearnDB();
