import { useEffect } from "react";
import { isTauriRuntime } from "@/lib/env";
import { useUpdaterStore } from "@/stores/updaterStore";

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

export function useUpdaterAutoCheck() {
  const checkForUpdates = useUpdaterStore((s) => s.checkForUpdates);

  useEffect(() => {
    if (!isTauriRuntime()) return;

    void checkForUpdates({ notify: true });
    const timer = window.setInterval(() => {
      void checkForUpdates({ notify: true });
    }, CHECK_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [checkForUpdates]);
}
