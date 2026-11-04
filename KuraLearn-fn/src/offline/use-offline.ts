import { useState, useEffect } from "react";
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
