import { Injectable, inject } from "@angular/core";
import type { SyncConfig, SyncEvent, SyncStatus } from "@termsh/platform";
import { TermshPlatformService } from "@termsh/platform";
import { BehaviorSubject } from "rxjs";
import { HostStateService } from "./host-state.service";
import { KeyStateService } from "./key-state.service";
import { SnippetStateService } from "./snippet-state.service";

const STORAGE_KEY = "termsh-sync-v1";

type PersistedSync = {
  serverUrl: string;
  accessToken: string;
  enabled: boolean;
  autoSync: boolean;
};

function loadPersisted(): PersistedSync {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("empty");
    return JSON.parse(raw) as PersistedSync;
  } catch {
    return { serverUrl: "", accessToken: "", enabled: false, autoSync: false };
  }
}

@Injectable({ providedIn: "root" })
export class SyncStateService {
  private readonly platform = inject(TermshPlatformService);
  private readonly hosts = inject(HostStateService);
  private readonly snippets = inject(SnippetStateService);
  private readonly keys = inject(KeyStateService);

  private readonly persisted$ = new BehaviorSubject<PersistedSync>(loadPersisted());
  private readonly status$ = new BehaviorSubject<SyncStatus | null>(null);
  private readonly syncing$ = new BehaviorSubject(false);
  private readonly error$ = new BehaviorSubject<string | null>(null);
  private readonly lastResult$ = new BehaviorSubject<SyncEvent | null>(null);

  private autoSyncTimer: ReturnType<typeof setInterval> | null = null;

  readonly persistedStream$ = this.persisted$.asObservable();
  readonly statusStream$ = this.status$.asObservable();
  readonly syncingStream$ = this.syncing$.asObservable();
  readonly errorStream$ = this.error$.asObservable();
  readonly lastResultStream$ = this.lastResult$.asObservable();

  get snapshot(): PersistedSync {
    return this.persisted$.value;
  }

  get status(): SyncStatus | null {
    return this.status$.value;
  }

  get syncing(): boolean {
    return this.syncing$.value;
  }

  private persist(next: PersistedSync) {
    this.persisted$.next(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private buildConfig(): SyncConfig | null {
    const { serverUrl, accessToken } = this.snapshot;
    if (!serverUrl.trim() || !accessToken.trim()) return null;
    return { apiUrl: serverUrl.trim(), accessToken: accessToken.trim() };
  }

  setServerUrl(serverUrl: string) {
    this.persist({ ...this.snapshot, serverUrl });
    this.error$.next(null);
  }

  setAccessToken(accessToken: string) {
    this.persist({ ...this.snapshot, accessToken });
    this.error$.next(null);
  }

  setEnabled(enabled: boolean) {
    this.persist({ ...this.snapshot, enabled });
    if (enabled) this.startAutoSyncTimer();
    else this.stopAutoSyncTimer();
  }

  setAutoSync(autoSync: boolean) {
    this.persist({ ...this.snapshot, autoSync });
  }

  clearError() {
    this.error$.next(null);
  }

  async checkStatus() {
    const config = this.buildConfig();
    if (!config) {
      this.status$.next(null);
      this.error$.next("settings.sync.serverRequired");
      return;
    }
    this.syncing$.next(true);
    this.error$.next(null);
    try {
      const status = await this.platform.syncStatus(config);
      this.status$.next(status);
    } catch (e) {
      this.error$.next(e instanceof Error ? e.message : String(e));
    } finally {
      this.syncing$.next(false);
    }
  }

  async pull() {
    const config = this.buildConfig();
    if (!config) return;
    this.syncing$.next(true);
    this.error$.next(null);
    try {
      const result = await this.platform.syncPull(config);
      this.lastResult$.next(result);
      await this.reloadLocalData();
      await this.checkStatus();
    } catch (e) {
      this.error$.next(e instanceof Error ? e.message : String(e));
    } finally {
      this.syncing$.next(false);
    }
  }

  async push() {
    const config = this.buildConfig();
    if (!config) return;
    this.syncing$.next(true);
    this.error$.next(null);
    try {
      const result = await this.platform.syncPush(config);
      this.lastResult$.next(result);
      await this.checkStatus();
    } catch (e) {
      this.error$.next(e instanceof Error ? e.message : String(e));
    } finally {
      this.syncing$.next(false);
    }
  }

  async runAutoSync() {
    const snap = this.snapshot;
    if (!snap.enabled || !snap.autoSync || this.syncing$.value) return;
    const config = this.buildConfig();
    if (!config) return;
    this.syncing$.next(true);
    this.error$.next(null);
    try {
      const pushed = await this.platform.syncPush(config);
      const pulled = await this.platform.syncPull(config);
      this.lastResult$.next({
        added: pulled.added,
        updated: pushed.updated + pulled.updated,
      });
      await this.reloadLocalData();
      await this.checkStatus();
    } catch (e) {
      this.error$.next(e instanceof Error ? e.message : String(e));
    } finally {
      this.syncing$.next(false);
    }
  }

  startAutoSyncTimer() {
    if (this.autoSyncTimer) return;
    this.autoSyncTimer = setInterval(() => {
      void this.runAutoSync();
    }, 5 * 60 * 1000);
  }

  stopAutoSyncTimer() {
    if (!this.autoSyncTimer) return;
    clearInterval(this.autoSyncTimer);
    this.autoSyncTimer = null;
  }

  private async reloadLocalData() {
    await Promise.all([this.hosts.load(), this.snippets.load(), this.keys.load()]);
  }
}
