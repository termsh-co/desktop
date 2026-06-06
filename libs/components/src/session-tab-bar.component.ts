import { AsyncPipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { TermshIconComponent, type IconName } from "@termsh/angular";
import type { Session } from "@termsh/common";
import {
  NavStateService,
  SessionStateService,
  TerminalLayoutStateService,
} from "@termsh/state";
import { combineLatest, map } from "rxjs";

function sessionIcon(session: Session): IconName {
  if (session.kind === "local") return "laptop";
  if (session.kind === "remote") return "folder";
  return "terminal";
}

function sessionTabLabel(session: Session): string {
  if (session.kind !== "remote") return session.title;
  const protocol = (session.remoteProtocol ?? "sftp").toUpperCase();
  return `${session.title} · ${protocol}`;
}

@Component({
  selector: "termsh-session-tab-bar",
  standalone: true,
  imports: [AsyncPipe, TranslateModule, TermshIconComponent],
  template: `
    <div class="session-bar" [attr.aria-label]="'session.tabBarAria' | translate">
      <button
        type="button"
        class="session-bar__terminal"
        [class.session-bar__terminal--active]="(inSessionView$ | async) === true"
        [class.session-bar__terminal--compact]="((sessions$ | async)?.length ?? 0) > 0"
        (click)="onTerminal()"
        [title]="'session.terminalTitle' | translate"
      >
        <termsh-icon name="terminal" [size]="15" />
        <span class="session-bar__terminal-label">{{ 'session.terminal' | translate }}</span>
        @if ((sessions$ | async)?.length; as count) {
          @if (count > 0) {
            <span class="session-bar__badge">{{ count }}</span>
          }
        }
      </button>

      <div class="session-bar__cluster">
        <nav
          class="session-bar__tabs mac-scrollbar"
          role="tablist"
          [attr.aria-label]="'session.openSessionsAria' | translate"
        >
          @for (session of sessions$ | async; track session.id) {
            <div
              class="session-tab"
              [class.session-tab--active]="
                (inSessionView$ | async) && (activeId$ | async) === session.id
              "
            >
              <button
                type="button"
                role="tab"
                class="session-tab__label"
                [attr.aria-selected]="(activeId$ | async) === session.id"
                (click)="openSession(session.id)"
                [title]="sessionTabLabel(session)"
              >
                <termsh-icon [name]="sessionIcon(session)" [size]="13" />
                <span>{{ sessionTabLabel(session) }}</span>
              </button>
              <button
                type="button"
                class="session-tab__close"
                (click)="onClose(session.id)"
                [attr.aria-label]="'session.closeSession' | translate"
              >
                <termsh-icon name="close" [size]="12" />
              </button>
            </div>
          }
        </nav>

        @if ((showSplit$ | async) === true) {
          <button
            type="button"
            class="session-tab session-tab__aux"
            (click)="toggleSplit()"
            [title]="((splitTitle$ | async) ?? '') | translate"
            [attr.aria-label]="'session.splitAria' | translate"
          >
            <termsh-icon
              [name]="((splitMode$ | async) === 'horizontal') ? 'split_horizontal' : 'split_vertical'"
              [size]="14"
            />
          </button>
        }
      </div>
    </div>
  `,
})
export class SessionTabBarComponent {
  private readonly sessions = inject(SessionStateService);
  private readonly nav = inject(NavStateService);
  private readonly layout = inject(TerminalLayoutStateService);

  readonly sessions$ = this.sessions.sessionsStream$;
  readonly activeId$ = this.sessions.activeSessionIdStream$;
  readonly inSessionView$ = this.nav.viewStream$.pipe(map((v) => v === "terminal"));
  readonly splitMode$ = this.layout.splitModeStream$;
  readonly splitTitle$ = this.splitMode$.pipe(
    map((mode) => {
      if (mode === "off") return "session.splitOff";
      if (mode === "vertical") return "session.splitVertical";
      return "session.splitHorizontal";
    }),
  );

  readonly showSplit$ = combineLatest([
    this.inSessionView$,
    this.sessions.sessionsStream$,
  ]).pipe(
    map(([inSession, list]) => {
      const terminalCount = list.filter((s) => s.kind !== "remote").length;
      return inSession && terminalCount >= 2;
    }),
  );

  sessionTabLabel = sessionTabLabel;

  onTerminal() {
    if (this.sessions.sessions.length === 0) {
      this.sessions.openLocalShell();
    }
    this.nav.setView("terminal");
  }

  openSession(sessionId: string) {
    this.sessions.setActiveSession(sessionId);
    this.nav.setView("terminal");
  }

  async onClose(sessionId: string) {
    const remaining = this.sessions.sessions.filter((s) => s.id !== sessionId);
    if (this.layout.secondarySessionId === sessionId) {
      this.layout.setSecondarySessionId(null);
    }
    await this.sessions.closeSession(sessionId);
    if (remaining.length > 0) {
      this.nav.setView("terminal");
    } else {
      this.layout.reset();
      this.nav.setView("hosts");
    }
  }

  toggleSplit() {
    this.layout.toggleSplitMode();
  }
}
