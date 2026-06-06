import { Injectable } from "@angular/core";
import type { Host } from "@termsh/common";
import { BehaviorSubject } from "rxjs";

export type AppView =
  | "hosts"
  | "terminal"
  | "snippets"
  | "remote"
  | "vault"
  | "keys"
  | "settings";

@Injectable({ providedIn: "root" })
export class NavStateService {
  private readonly view$ = new BehaviorSubject<AppView>("hosts");
  private readonly paletteOpen$ = new BehaviorSubject(false);
  private readonly hostDrawerOpen$ = new BehaviorSubject(false);
  private readonly hostDrawerHost$ = new BehaviorSubject<Host | null>(null);

  readonly viewStream$ = this.view$.asObservable();
  readonly paletteOpen$stream = this.paletteOpen$.asObservable();
  readonly hostDrawerOpen$stream = this.hostDrawerOpen$.asObservable();
  readonly hostDrawerHost$stream = this.hostDrawerHost$.asObservable();

  get view(): AppView {
    return this.view$.value;
  }

  get paletteOpen(): boolean {
    return this.paletteOpen$.value;
  }

  setView(view: AppView) {
    this.view$.next(view);
  }

  openPalette() {
    this.paletteOpen$.next(true);
  }

  closePalette() {
    this.paletteOpen$.next(false);
  }

  openHostDrawer(host: Host | null = null) {
    this.hostDrawerHost$.next(host);
    this.hostDrawerOpen$.next(true);
    this.setView("hosts");
  }

  closeHostDrawer() {
    this.hostDrawerOpen$.next(false);
    this.hostDrawerHost$.next(null);
  }
}
