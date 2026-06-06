import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export type SplitMode = "off" | "vertical" | "horizontal";

@Injectable({ providedIn: "root" })
export class TerminalLayoutStateService {
  private readonly splitMode$ = new BehaviorSubject<SplitMode>("off");
  private readonly secondarySessionId$ = new BehaviorSubject<string | null>(null);

  readonly splitModeStream$ = this.splitMode$.asObservable();
  readonly secondarySessionIdStream$ = this.secondarySessionId$.asObservable();

  get splitMode(): SplitMode {
    return this.splitMode$.value;
  }

  get secondarySessionId(): string | null {
    return this.secondarySessionId$.value;
  }

  setSplitMode(mode: SplitMode) {
    this.splitMode$.next(mode);
    if (mode === "off") {
      this.secondarySessionId$.next(null);
    }
  }

  toggleSplitMode() {
    const next: SplitMode =
      this.splitMode === "off"
        ? "vertical"
        : this.splitMode === "vertical"
          ? "horizontal"
          : "off";
    this.setSplitMode(next);
  }

  setSecondarySessionId(id: string | null) {
    this.secondarySessionId$.next(id);
  }

  reset() {
    this.splitMode$.next("off");
    this.secondarySessionId$.next(null);
  }
}
