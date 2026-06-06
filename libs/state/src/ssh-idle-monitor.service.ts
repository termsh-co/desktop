import { Injectable, inject } from "@angular/core";
import { sshIdleTimeoutMs } from "@termsh/common";
import { getSessionActivity } from "./session-activity";
import { SessionStateService } from "./session-state.service";
import { SettingsStateService } from "./settings-state.service";

const CHECK_INTERVAL_MS = 30_000;

@Injectable({ providedIn: "root" })
export class SshIdleMonitorService {
  private readonly sessions = inject(SessionStateService);
  private readonly settings = inject(SettingsStateService);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), CHECK_INTERVAL_MS);
  }

  private tick() {
    const minutes = this.settings.snapshot.sshIdleTimeoutMinutes;
    if (minutes <= 0) return;

    const limitMs = sshIdleTimeoutMs(minutes);
    const now = Date.now();

    for (const session of this.sessions.sessions) {
      if (session.kind !== "ssh" || session.sshPhase !== "ready") continue;

      const last = getSessionActivity(session.id);
      if (last === undefined) continue;

      if (now - last >= limitMs) {
        void this.sessions.closeSession(session.id);
      }
    }
  }
}
