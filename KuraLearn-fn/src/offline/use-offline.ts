import { useEffect, useState } from "react";
import { db } from "./db";
import { syncManager } from "./sync-manager";

export function useOffline() {
  const [isOnline, setIsOnline] = useState(syncManager.isOnline);

  useEffect(() => {
    const unsubscribe = syncManager.subscribe(setIsOnline);
    return () => {
      unsubscribe();
    };
  }, []);

  return { isOnline, isOffline: !isOnline };
}

/** Number of changes saved on this device that have not reached the server yet. */
export function usePendingSyncCount(pollMs = 4000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const refresh = () =>
      db.syncQueue
        .count()
        .then((value) => active && setCount(value))
        .catch(() => active && setCount(0));
    refresh();
    const timer = window.setInterval(refresh, pollMs);
    const unsubscribe = syncManager.subscribe(refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [pollMs]);

  return count;
}
