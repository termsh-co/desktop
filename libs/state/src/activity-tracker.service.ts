import { Injectable, inject } from "@angular/core";
import { TermshPlatformService } from "@termsh/platform";

const THROTTLE_MS = 30_000;

@Injectable({ providedIn: "root" })
export class ActivityTrackerService {
  private readonly platform = inject(TermshPlatformService);
  private started = false;
  private lastPing = 0;

  start() {
    if (this.started || typeof document === "undefined") return;
    this.started = true;
    const handler = () => this.ping();
    document.addEventListener("click", handler, { passive: true });
    document.addEventListener("keydown", handler, { passive: true });
    document.addEventListener("mousedown", handler, { passive: true });
  }

  ping() {
    const now = Date.now();
    if (now - this.lastPing < THROTTLE_MS) return;
    this.lastPing = now;
    this.platform.pingActivity();
  }
}
