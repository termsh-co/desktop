import { AsyncPipe } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import type { Host } from "@termsh/common";
import { HostStateService, NavStateService, SessionStateService } from "@termsh/state";
import { HostOsIconComponent } from "./host-os-icon.component";

@Component({
  selector: "termsh-remote-view",
  standalone: true,
  imports: [AsyncPipe, TranslateModule, HostOsIconComponent],
  template: `
    <div class="view view--remote">
      <header class="view__head">
        <h1>{{ 'palette.nav.remote' | translate }}</h1>
        <p class="view__sub">{{ 'remote.view.empty' | translate }}</p>
      </header>
      <div class="view__scroll mac-scrollbar">
        @if (hostState.loading$stream | async) {
          <p class="view__empty">{{ 'vault.gate.loading' | translate }}</p>
        } @else if ((hostState.hostsStream$ | async)?.length === 0) {
          <p class="view__empty">{{ 'remote.view.empty' | translate }}</p>
        } @else {
          <ul class="host-list__items">
            @for (host of hostState.hostsStream$ | async; track host.id) {
              <li>
                <article class="host-row">
                  <button type="button" class="host-row__main" (click)="openRemote(host)">
                    <termsh-host-os-icon [host]="host" [size]="28" />
                    <span class="host-row__text">
                      <span class="host-row__name">{{ host.name }}</span>
                      <span class="host-row__addr">{{ formatAddr(host) }}</span>
                    </span>
                  </button>
                </article>
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
})
export class RemoteViewComponent implements OnInit {
  readonly hostState = inject(HostStateService);
  private readonly sessions = inject(SessionStateService);
  private readonly nav = inject(NavStateService);

  ngOnInit() {
    void this.hostState.load();
  }

  formatAddr(host: Host): string {
    return host.port === 22
      ? `${host.username}@${host.hostname}`
      : `${host.username}@${host.hostname}:${host.port}`;
  }

  openRemote(host: Host) {
    this.sessions.openRemoteSession(host);
    this.nav.setView("terminal");
  }
}
