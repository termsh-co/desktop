import { Injectable, inject } from "@angular/core";
import { TermshPlatformService } from "@termsh/platform";
import { BehaviorSubject } from "rxjs";

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

@Injectable({ providedIn: "root" })
export class UpdaterStateService {
  private readonly platform = inject(TermshPlatformService);

  private readonly updateAvailable$ = new BehaviorSubject(false);
  private readonly updateVersion$ = new BehaviorSubject<string | null>(null);
  private readonly checking$ = new BehaviorSubject(false);
  private readonly installing$ = new BehaviorSubject(false);
  private readonly lastMessage$ = new BehaviorSubject<string | null>(null);
  private readonly lastNotifiedVersion$ = new BehaviorSubject<string | null>(null);

  private started = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  readonly updateAvailableStream$ = this.updateAvailable$.asObservable();
  readonly updateVersionStream$ = this.updateVersion$.asObservable();
  readonly checkingStream$ = this.checking$.asObservable();
  readonly installingStream$ = this.installing$.asObservable();
  readonly lastMessageStream$ = this.lastMessage$.asObservable();

  get updateAvailable(): boolean {
    return this.updateAvailable$.value;
  }

  get updateVersion(): string | null {
    return this.updateVersion$.value;
  }

  start() {
    if (this.started) return;
    this.started = true;

    this.platform.onUpdaterAvailable(({ version }) => {
      this.updateAvailable$.next(true);
      this.updateVersion$.next(version);
      this.maybeNotify(version);
    });
    this.platform.onUpdaterNotAvailable(() => {
      this.updateAvailable$.next(false);
      this.updateVersion$.next(null);
    });
    this.platform.onUpdaterError(({ message }) => {
      this.lastMessage$.next(message);
    });

    void this.check({ notify: true });
    this.intervalId = setInterval(() => {
      void this.check({ notify: true });
    }, CHECK_INTERVAL_MS);
  }

  async check(options?: { notify?: boolean }) {
    if (this.checking$.value) return;
    this.checking$.next(true);
    this.lastMessage$.next(null);
    try {
      const result = await this.platform.updaterCheck();
      if (result.dev) {
        this.lastMessage$.next("settings.updates.devOnly");
        return;
      }
      if (result.error) {
        this.lastMessage$.next(result.error);
        return;
      }
      if (result.available && result.version) {
        this.updateAvailable$.next(true);
        this.updateVersion$.next(result.version);
        if (options?.notify !== false) {
          this.maybeNotify(result.version);
        }
      } else {
        this.updateAvailable$.next(false);
        this.updateVersion$.next(null);
        if (options?.notify === false) {
          this.lastMessage$.next("updater.noUpdate");
        }
      }
    } finally {
      this.checking$.next(false);
    }
  }

  async install() {
    if (this.installing$.value) return;
    this.installing$.next(true);
    try {
      await this.platform.updaterInstall();
      this.updateAvailable$.next(false);
      this.updateVersion$.next(null);
    } catch (err) {
      this.lastMessage$.next(err instanceof Error ? err.message : String(err));
    } finally {
      this.installing$.next(false);
    }
  }

  dismiss() {
    this.updateAvailable$.next(false);
  }

  private maybeNotify(version: string) {
    if (version === this.lastNotifiedVersion$.value) return;
    this.lastNotifiedVersion$.next(version);

    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      new Notification("termsh update", {
        body: `Version ${version} is available.`,
      });
      return;
    }
    if (Notification.permission !== "denied") {
      void Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          new Notification("termsh update", {
            body: `Version ${version} is available.`,
          });
        }
      });
    }
  }
}
