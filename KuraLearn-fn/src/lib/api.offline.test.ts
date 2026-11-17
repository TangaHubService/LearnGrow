import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const enqueue = vi.fn();
vi.mock("../offline/sync-manager", () => ({
  syncManager: {
    enqueue,
    configure: vi.fn(),
    processQueue: vi.fn(),
    subscribe: vi.fn(() => () => undefined),
  },
}));

const { apiRequest, isQueuedOffline } = await import("./api");

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", { configurable: true, get: () => value });
}

describe("offline changes", () => {
  beforeEach(() => {
    enqueue.mockReset();
    localStorage.setItem(
      "kuralearn_user",
      JSON.stringify({ id: "teacher-1", email: "t@example.com", role: "TEACHER", roles: [] }),
    );
    localStorage.setItem("kuralearn_token", "token-1");
    localStorage.setItem("kuralearn_locale", "en");
  });
  afterEach(() => {
    setOnline(true);
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("keeps an attendance change on the device, tagged with the user who made it", async () => {
    setOnline(false);
    const error: any = await apiRequest("/attendance/mark", {
      method: "POST",
      body: JSON.stringify({ classId: "c1" }),
    }).catch((e: any) => e);
    expect(isQueuedOffline(error)).toBe(true);
    expect(error.message).toMatch(/Saved on this device/);
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        body: { classId: "c1" },
        userId: "teacher-1",
        action: "POST /attendance/mark",
      }),
    );
  });

  it("shows the offline message in the chosen language", async () => {
    setOnline(false);
    localStorage.setItem("kuralearn_locale", "rw");
    const error: any = await apiRequest("/attendance/mark", { method: "POST", body: "{}" }).catch(
      (e: any) => e,
    );
    expect(error.message).toMatch(/Byabitswe kuri iki gikoresho/);
  });

  it.each([
    ["/auth/login", "sign-in"],
    ["/ai/chat", "AI"],
  ])("never queues %s (%s needs a connection)", async (path) => {
    setOnline(false);
    const error: any = await apiRequest(path, { method: "POST", body: "{}" }).catch((e: any) => e);
    expect(isQueuedOffline(error)).toBe(false);
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("never queues file uploads", async () => {
    setOnline(false);
    const error: any = await apiRequest("/resources/upload", {
      method: "POST",
      body: new FormData(),
    }).catch((e: any) => e);
    expect(isQueuedOffline(error)).toBe(false);
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("queues a change when the connection drops mid-request", async () => {
    setOnline(true);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const error: any = await apiRequest("/teacher/attendance", { method: "POST", body: "{}" }).catch(
      (e: any) => e,
    );
    expect(isQueuedOffline(error)).toBe(true);
    expect(enqueue).toHaveBeenCalledTimes(1);
  });

  it("does not queue reads", async () => {
    setOnline(true);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(apiRequest("/notifications")).rejects.toThrow("Failed to fetch");
    expect(enqueue).not.toHaveBeenCalled();
  });
});
