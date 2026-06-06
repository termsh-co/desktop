import { AsyncPipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import {
  HostStateService,
  SessionStateService,
  SyncStateService,
  VaultStateService,
} from "@termsh/state";
import { combineLatest, map, startWith } from "rxjs";

@Component({
  selector: "termsh-status-bar",
  standalone: true,
  imports: [AsyncPipe, TranslateModule],
  template: `
    <footer class="status-bar" aria-live="polite">
      <span class="status-bar__item">{{ conn$ | async }}</span>
      <span class="status-bar__sep"></span>
      <span class="status-bar__item">
        {{ 'common.status.sessions' | translate: { count: (sessionCount$ | async) ?? 0 } }}
      </span>
      <span class="status-bar__sep"></span>
      <span class="status-bar__item">{{ vaultLabel | translate }}</span>
      <span class="status-bar__sep"></span>
      <span class="status-bar__item status-bar__muted">
        {{ 'common.status.hosts' | translate: { count: (hosts.hostsStream$ | async)?.length ?? 0 } }}
      </span>
      <span class="status-bar__sep"></span>
      <span class="status-bar__item status-bar__muted">{{ sync$ | async }}</span>
    </footer>
  `,
})
export class StatusBarComponent {
  readonly hosts = inject(HostStateService);
  private readonly vault = inject(VaultStateService);
  private readonly sessions = inject(SessionStateService);
  private readonly sync = inject(SyncStateService);
  private readonly translate = inject(TranslateService);

  readonly sessionCount$ = this.sessions.sessionsStream$.pipe(map((s) => s.length));

  readonly conn$ = combineLatest([
    this.sessions.sessionsStream$,
    this.sessions.activeSessionIdStream$,
    this.hosts.hostsStream$,
    this.translate.onLangChange.pipe(startWith(null)),
    this.translate.onTranslationChange.pipe(startWith(null)),
  ]).pipe(
    map(([sessions, activeId, hostList]) => {
      const active = sessions.find((s) => s.id === activeId);
      if (!active) return this.translate.instant("common.status.disconnected");
      if (active.kind === "local") return this.translate.instant("common.status.local");
      const host = active.hostId ? hostList.find((h) => h.id === active.hostId) : null;
      if (active.kind === "ssh" && host) {
        return this.translate.instant("common.status.ssh", {
          user: host.username,
          host: host.hostname,
        });
      }
      if (active.kind === "remote" && host) {
        const protocol = (active.remoteProtocol ?? "sftp").toUpperCase();
        return this.translate.instant("common.status.remote", {
          protocol,
          user: host.username,
          host: host.hostname,
        });
      }
      return this.translate.instant("common.status.disconnected");
    }),
  );

  readonly sync$ = combineLatest([
    this.sync.persistedStream$,
    this.sync.statusStream$,
    this.translate.onLangChange.pipe(startWith(null)),
    this.translate.onTranslationChange.pipe(startWith(null)),
  ]).pipe(
    map(([persisted, status]) => {
      if (!persisted.enabled) {
        return this.translate.instant("common.status.syncOff");
      }
      if (status?.connected && status.email) {
        return this.translate.instant("common.status.syncConnected", { email: status.email });
      }
      return this.translate.instant("common.status.syncNoConnection");
    }),
  );

  get vaultLabel(): string {
    const s = this.vault.status;
    if (!s?.isSetup) return "common.status.vaultNone";
    return s.isUnlocked ? "common.status.vaultUnlocked" : "common.status.vaultLocked";
  }
}
