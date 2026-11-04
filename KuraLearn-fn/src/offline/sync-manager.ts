import { db, type SyncQueueItem } from "./db";

class SyncManager {
  private isSyncing = false;
  private listeners: Set<(online: boolean) => void> = new Set();
  private _isOnline = navigator.onLine;

  get isOnline() {
    return this._isOnline;
  }

  constructor() {
    window.addEventListener("online", () => {
      this._isOnline = true;
      this.notifyListeners(true);
      this.processQueue();
    });

    window.addEventListener("offline", () => {
      this._isOnline = false;
      this.notifyListeners(false);
    });
  }

  subscribe(listener: (online: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(online: boolean) {
    this.listeners.forEach((fn) => fn(online));
  }

  async enqueue(item: Omit<SyncQueueItem, "id" | "createdAt" | "retryCount" | "maxRetries">) {
    await db.syncQueue.add({
      ...item,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 5,
    });

    if (navigator.onLine) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isSyncing || !navigator.onLine) return;

    this.isSyncing = true;
    try {
      const items = await db.syncQueue.orderBy("createdAt").toArray();

      for (const item of items) {
        try {
          const response = await fetch(item.endpoint, {
            method: item.method,
            headers: { "Content-Type": "application/json" },
            body: item.body ? JSON.stringify(item.body) : undefined,
          });

          if (response.ok) {
            await db.syncQueue.delete(item.id!);
          } else if (response.status < 500) {
            await db.syncQueue.delete(item.id!);
          } else {
            throw new Error(`Server error: ${response.status}`);
          }
        } catch {
          if (item.retryCount >= item.maxRetries) {
            await db.syncQueue.delete(item.id!);
          } else {
            await db.syncQueue.update(item.id!, {
              retryCount: item.retryCount + 1,
            });
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncManager = new SyncManager();
