import { AsyncPipe } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { TermshIconComponent } from "@termsh/angular";
import type { Host } from "@termsh/common";
import { HostStateService, NavStateService, SessionStateService } from "@termsh/state";
import { HostOsIconComponent } from "./host-os-icon.component";

@Component({
  selector: "termsh-hosts-panel",
  standalone: true,
  imports: [AsyncPipe, TranslateModule, TermshIconComponent, HostOsIconComponent],
  template: `
    <div class="view view--hosts">
      <div class="content-toolbar">
        <button
          type="button"
          class="content-toolbar__btn content-toolbar__btn--primary"
          (click)="openNewHost()"
        >
          <termsh-icon name="add" [size]="16" />
          {{ 'hosts.toolbar.newHost' | translate }}
        </button>
        <button type="button" class="content-toolbar__btn" (click)="openTerminal()">
          <termsh-icon name="terminal" [size]="16" />
          {{ 'hosts.toolbar.terminal' | translate }}
        </button>
      </div>

      <div class="host-list mac-scrollbar">
        @if (hostState.loading$stream | async) {
          <p class="host-list__empty">{{ 'vault.gate.loading' | translate }}</p>
        } @else if ((hostState.hostsStream$ | async)?.length === 0) {
          <div class="host-list__empty">
            <p>{{ 'hosts.empty.message' | translate }}</p>
            <button type="button" class="btn btn--primary" (click)="openNewHost()">
              {{ 'hosts.empty.addButton' | translate }}
            </button>
          </div>
        } @else {
          <ul class="host-list__items">
            @for (host of hostState.hostsStream$ | async; track host.id) {
              <li>
                <article class="host-row">
                  <button type="button" class="host-row__main" (click)="connect(host)">
                    @if (host.color) {
                      <span class="host-row__color" [style.backgroundColor]="host.color"></span>
                    }
                    <termsh-host-os-icon [host]="host" [size]="28" />
                    <span class="host-row__text">
                      <span class="host-row__name">{{ host.name }}</span>
                      <span class="host-row__addr">{{ formatAddr(host) }}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    class="host-row__edit"
                    (click)="editHost(host)"
                    [attr.aria-label]="'common.actions.edit' | translate"
                  >
                    <termsh-icon name="edit" [size]="14" />
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
export class HostsPanelComponent implements OnInit {
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

  openNewHost() {
    this.nav.openHostDrawer(null);
  }

  editHost(host: Host) {
    this.nav.openHostDrawer(host);
  }

  openTerminal() {
    this.sessions.openLocalShell();
    this.nav.setView("terminal");
  }

  connect(host: Host) {
    this.sessions.openSshSession(host);
    this.nav.setView("terminal");
  }
}
