/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope;

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";
import { BackgroundSyncPlugin } from "workbox-background-sync";
import { ExpirationPlugin } from "workbox-expiration";

precacheAndRoute(self.__WB_MANIFEST);

const attendanceSync = new BackgroundSyncPlugin("attendance-queue", {
  maxRetentionTime: 24 * 60,
});

registerRoute(
  /\/api\/v1\/attendance\/.*/,
  new NetworkFirst({
    cacheName: "attendance-cache",
    plugins: [attendanceSync],
  }),
  "POST",
);

registerRoute(
  /\/api\/v1\/lessons\/.*/,
  new NetworkFirst({
    cacheName: "lessons-cache",
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 })],
  }),
);

registerRoute(
  /\/api\/v1\/courses\/.*/,
  new NetworkFirst({
    cacheName: "courses-cache",
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 })],
  }),
);

registerRoute(
  /\/uploads\/.*/,
  new CacheFirst({
    cacheName: "uploads-cache",
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
);

self.addEventListener("sync", ((event: any) => {
  if (event.tag === "sync-attendance") {
    event.waitUntil(syncAttendance());
  }
}) as EventListener);

async function syncAttendance() {
  const cache = await caches.open("attendance-cache");
  const requests = await cache.keys();
  for (const request of requests) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.delete(request);
      }
    } catch {
      // Still offline: leave the request cached so the next sync retries it.
    }
  }
}
