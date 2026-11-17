import { db, type SyncQueueItem } from "./db";

type AuthProvider = {
  /** Current access token and signed-in user id, if any. */
  current: () => { token?: string; userId?: string };
  /** Refresh the access token; resolves once a new one is stored. */
  refresh: () => Promise<unknown>;
};

/**
 * Keeps changes made without a connection on this device and sends them, as the same
 * user who made them, once the connection returns.
 */
class SyncManager {
  private isSyncing = false;
  private listeners: Set<(online: boolean) => void> = new Set();
  private _isOnline = typeof navigator === "undefined" ? true : navigator.onLine;
  private auth: AuthProvider | null = null;

  get isOnline() {
    return this._isOnline;
  }

  constructor() {
    if (typeof window === "undefined") return;
    window.addEventListener("online", () => {
      this._isOnline = true;
      this.notifyListeners(true);
      void this.processQueue();
    });
    window.addEventListener("offline", () => {
      this._isOnline = false;
      this.notifyListeners(false);
    });
  }

  /** Called once by the API client so replays carry the user's own credentials. */
  configure(auth: AuthProvider) {
    this.auth = auth;
    // Send anything left over from an earlier visit.
    void this.processQueue();
  }

  subscribe(listener: (online: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(online: boolean) {
    this.listeners.forEach((fn) => fn(online));
  }

  async enqueue(item: Omit<SyncQueueItem, "id" | "createdAt" | "retryCount" | "maxRetries">) {
    await db.syncQueue.add({ ...item, createdAt: Date.now(), retryCount: 0, maxRetries: 5 });
    this.notifyListeners(this._isOnline);
  }

  private async send(item: SyncQueueItem, token?: string) {
    return fetch(item.endpoint, {
      method: item.method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: item.body !== undefined ? JSON.stringify(item.body) : undefined,
    });
  }

  async processQueue() {
    if (this.isSyncing || !navigator.onLine || !this.auth) return;
    const { userId } = this.auth.current();
    if (!userId) return; // Nobody signed in: keep everything until its owner returns.

    this.isSyncing = true;
    try {
      const items = await db.syncQueue.orderBy("createdAt").toArray();
      for (const item of items) {
        // Only the person who made a change may send it.
        if (item.userId && item.userId !== userId) continue;
        try {
          let response = await this.send(item, this.auth.current().token);
          if (response.status === 401) {
            await this.auth.refresh();
            response = await this.send(item, this.auth.current().token);
          }
          if (
            response.ok ||
            (response.status >= 400 && response.status < 500 && response.status !== 401)
          ) {
            // Done, or rejected by the server for a reason a retry will not fix.
            if (!response.ok)
              console.warn(`[sync] ${item.action} was rejected (${response.status})`);
            await db.syncQueue.delete(item.id!);
          } else {
            throw new Error(`Server responded ${response.status}`);
          }
        } catch {
          if (item.retryCount + 1 >= item.maxRetries) {
            console.warn(`[sync] giving up on ${item.action} after ${item.maxRetries} tries`);
            await db.syncQueue.delete(item.id!);
          } else {
            await db.syncQueue.update(item.id!, { retryCount: item.retryCount + 1 });
          }
        }
      }
    } finally {
      this.isSyncing = false;
      this.notifyListeners(this._isOnline);
    }
  }

  /** Pending changes that belong to a given user. */
  async pendingFor(userId: string) {
    return db.syncQueue.filter((item) => !item.userId || item.userId === userId).count();
  }
}

export const syncManager = new SyncManager();
