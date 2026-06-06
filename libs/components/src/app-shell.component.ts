import { Component, inject } from "@angular/core";
import { AsyncPipe, NgComponentOutlet } from "@angular/common";
import {
  HostDrawerComponent,
  HostsPanelComponent,
  KeysViewComponent,
  RemoteViewComponent,
  SettingsViewComponent,
  SnippetsViewComponent,
} from "@termsh/ssh";
import { TerminalViewComponent } from "@termsh/terminal";
import { NavStateService } from "@termsh/state";
import { from, shareReplay } from "rxjs";
import { AppHeaderComponent } from "./app-header.component";
import { CommandPaletteComponent } from "./command-palette.component";
import { SessionTabBarComponent } from "./session-tab-bar.component";
import { SidebarComponent } from "./sidebar.component";
import { StatusBarComponent } from "./status-bar.component";

@Component({
  selector: "termsh-app-shell",
  standalone: true,
  imports: [
    AsyncPipe,
    NgComponentOutlet,
    AppHeaderComponent,
    SidebarComponent,
    SessionTabBarComponent,
    StatusBarComponent,
    CommandPaletteComponent,
    HostDrawerComponent,
    HostsPanelComponent,
    SnippetsViewComponent,
    KeysViewComponent,
    SettingsViewComponent,
    RemoteViewComponent,
    TerminalViewComponent,
  ],
  template: `
    <div class="app" [class.app--drawer-open]="nav.hostDrawerOpen$stream | async">
      <termsh-app-header />
      <div class="app__body">
        <termsh-sidebar />
        <div class="app__workspace">
          <termsh-session-tab-bar />
          <div
            class="app__stage"
            [class.app__stage--session]="(view$ | async) === 'terminal'"
            [class.app__stage--pages]="(view$ | async) !== 'terminal'"
          >
            <div class="app__pages">
              <div class="main-content">
                <div
                  class="main-content__pane"
                  [class.main-content__pane--active]="(view$ | async) === 'hosts'"
                  [attr.aria-hidden]="(view$ | async) !== 'hosts'"
                >
                  <termsh-hosts-panel />
                </div>
                <div
                  class="main-content__pane"
                  [class.main-content__pane--active]="(view$ | async) === 'snippets'"
                  [attr.aria-hidden]="(view$ | async) !== 'snippets'"
                >
                  <termsh-snippets-view />
                </div>
                <div
                  class="main-content__pane"
                  [class.main-content__pane--active]="(view$ | async) === 'keys'"
                  [attr.aria-hidden]="(view$ | async) !== 'keys'"
                >
                  <termsh-keys-view />
                </div>
                <div
                  class="main-content__pane"
                  [class.main-content__pane--active]="(view$ | async) === 'vault'"
                  [attr.aria-hidden]="(view$ | async) !== 'vault'"
                >
                  @if ((view$ | async) === 'vault') {
                    @if (vaultView$ | async; as vaultView) {
                      <ng-container *ngComponentOutlet="vaultView" />
                    }
                  }
                </div>
                <div
                  class="main-content__pane"
                  [class.main-content__pane--active]="(view$ | async) === 'settings'"
                  [attr.aria-hidden]="(view$ | async) !== 'settings'"
                >
                  <termsh-settings-view />
                </div>
                <div
                  class="main-content__pane"
                  [class.main-content__pane--active]="(view$ | async) === 'remote'"
                  [attr.aria-hidden]="(view$ | async) !== 'remote'"
                >
                  <termsh-remote-view />
                </div>
              </div>
            </div>
            <div class="app__session-view" [attr.aria-hidden]="(view$ | async) !== 'terminal'">
              <termsh-terminal-view />
            </div>
          </div>
        </div>
      </div>
      <termsh-status-bar />
      <termsh-command-palette />
      <termsh-host-drawer
        [open]="(nav.hostDrawerOpen$stream | async) ?? false"
        [host]="nav.hostDrawerHost$stream | async"
        (close)="nav.closeHostDrawer()"
      />
    </div>
  `,
})
export class AppShellComponent {
  readonly nav = inject(NavStateService);
  readonly view$ = this.nav.viewStream$;
  readonly vaultView$ = from(import("@termsh/vault").then((m) => m.VaultViewComponent)).pipe(
    shareReplay(1),
  );
}
