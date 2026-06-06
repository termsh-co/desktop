import { useEffect } from "react";
import { sshIdleTimeoutMs } from "@/lib/settings/sshIdle";
import { getSessionActivity } from "@/lib/session/activity";
import { useSessionStore } from "@/stores/sessionStore";
import { useSettingsStore } from "@/stores/settingsStore";

const CHECK_INTERVAL_MS = 30_000;

/**
 * Ayarlardaki süreye göre hareketsiz SSH oturumlarını kapatır.
 * Varsayılan (0) = kapalı.
 */
export function useSshIdleMonitor() {
  const sshIdleTimeoutMinutes = useSettingsStore((s) => s.sshIdleTimeoutMinutes);

  useEffect(() => {
    if (sshIdleTimeoutMinutes <= 0) return;

    const tick = () => {
      const minutes = useSettingsStore.getState().sshIdleTimeoutMinutes;
      if (minutes <= 0) return;

      const limitMs = sshIdleTimeoutMs(minutes);
      const now = Date.now();
      const { sessions, closeSession } = useSessionStore.getState();

      for (const session of sessions) {
        if (session.kind !== "ssh" || session.sshPhase !== "ready") continue;

        const last = getSessionActivity(session.id);
        if (last === undefined) {
          continue;
        }
        if (now - last >= limitMs) {
          void closeSession(session.id);
        }
      }
    };

    const interval = window.setInterval(tick, CHECK_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [sshIdleTimeoutMinutes]);
}
