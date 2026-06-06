import { AsyncPipe } from "@angular/common";
import { Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TranslateModule } from "@ngx-translate/core";
import type { Session } from "@termsh/common";
import { RemoteExplorerPaneComponent } from "@termsh/ssh";
import {
  NavStateService,
  SessionStateService,
  TerminalLayoutStateService,
  type SplitMode,
} from "@termsh/state";
import { combineLatest, map } from "rxjs";
import { SplitPaneBarComponent } from "./split-pane-bar.component";
import { SshConnectScreenComponent } from "./ssh-connect-screen.component";
import { XtermTerminalComponent } from "./xterm-terminal.component";

type SplitVm = {
  splitMode: SplitMode;
  secondaryId: string | null;
  splitEnabled: boolean;
  primary: Session | null;
  secondary: Session | null;
  secondaryOptions: Session[];
  activeId: string | null;
};

@Component({
  selector: "termsh-terminal-pane",
  standalone: true,
  imports: [
    AsyncPipe,
    TranslateModule,
    RemoteExplorerPaneComponent,
    SshConnectScreenComponent,
    XtermTerminalComponent,
    SplitPaneBarComponent,
  ],
  template: `
    @if ((activeRemote$ | async); as remote) {
      <div class="terminal terminal--remote">
        <termsh-remote-explorer-pane [session]="remote" [active]="true" />
      </div>
    } @else {
      @if ((terminalSessions$ | async); as sessions) {
        @if (sessions.length === 0) {
          <div class="terminal terminal--idle">
            <p class="terminal__hint">{{ 'terminal.idle.hint' | translate }}</p>
            <button type="button" class="btn btn--primary" (click)="openTerminal()">
              {{ 'terminal.idle.openTerminal' | translate }}
            </button>
          </div>
        } @else {
          @if (splitVm$ | async; as vm) {
            @if (vm.splitEnabled && vm.primary && vm.secondary) {
              <div class="terminal terminal-split terminal-split--{{ vm.splitMode }}">
            <div class="terminal-split__pane">
              <termsh-split-pane-bar role="primary" [session]="vm.primary" />
              <div class="terminal-split__body">
                @if (vm.primary.kind === 'ssh' && vm.primary.sshPhase !== 'ready') {
                  <termsh-ssh-connect-screen [session]="vm.primary" [active]="true" />
                } @else {
                  <termsh-xterm-terminal
                    [sessionId]="vm.primary.id"
                    [kind]="vm.primary.kind"
                    [hostId]="vm.primary.hostId"
                    [active]="true"
                    [focusOnActive]="true"
                    [sshAlreadyStarted]="vm.primary.kind === 'ssh'"
                  />
                }
              </div>
            </div>
            <div class="terminal-split__divider" aria-hidden="true"></div>
            <div class="terminal-split__pane">
              <termsh-split-pane-bar
                role="secondary"
                [session]="vm.secondary"
                [secondaryOptions]="vm.secondaryOptions"
                [secondarySessionId]="vm.secondaryId"
                (secondaryChange)="onSecondaryPick($event)"
              />
              <div class="terminal-split__body">
                @if (vm.secondary.kind === 'ssh' && vm.secondary.sshPhase !== 'ready') {
                  <termsh-ssh-connect-screen [session]="vm.secondary" [active]="true" />
                } @else {
                  <termsh-xterm-terminal
                    [sessionId]="vm.secondary.id"
                    [kind]="vm.secondary.kind"
                    [hostId]="vm.secondary.hostId"
                    [active]="true"
                    [focusOnActive]="false"
                    [sshAlreadyStarted]="vm.secondary.kind === 'ssh'"
                  />
                }
              </div>
            </div>
          </div>
            } @else {
              <div class="terminal">
                @for (session of sessions; track session.id) {
                  @if (mountedIds().has(session.id)) {
                    @if (session.kind === 'ssh' && session.sshPhase !== 'ready') {
                      <termsh-ssh-connect-screen
                        [session]="session"
                        [active]="vm.activeId === session.id"
                      />
                    } @else {
                      <termsh-xterm-terminal
                        [sessionId]="session.id"
                        [kind]="session.kind"
                        [hostId]="session.hostId"
                        [active]="vm.activeId === session.id"
                        [focusOnActive]="true"
                        [sshAlreadyStarted]="session.kind === 'ssh'"
                      />
                    }
                  }
                }
              </div>
            }
          }
        }
      }
    }
  `,
})
export class TerminalPaneComponent implements OnInit {
  private readonly sessions = inject(SessionStateService);
  private readonly nav = inject(NavStateService);
  private readonly layout = inject(TerminalLayoutStateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly mountedIds = signal(new Set<string>());

  readonly terminalSessions$ = this.sessions.sessionsStream$.pipe(
    map((list) => list.filter((s) => s.kind !== "remote")),
  );

  readonly activeId$ = this.sessions.activeSessionIdStream$;

  readonly activeRemote$ = combineLatest([
    this.sessions.sessionsStream$,
    this.sessions.activeSessionIdStream$,
  ]).pipe(
    map(([list, id]) => {
      const active = list.find((s) => s.id === id);
      return active?.kind === "remote" ? active : null;
    }),
  );

  readonly splitVm$ = combineLatest([
    this.terminalSessions$,
    this.sessions.activeSessionIdStream$,
    this.layout.splitModeStream$,
    this.layout.secondarySessionIdStream$,
  ]).pipe(
    map(([terminalSessions, activeId, splitMode, secondaryId]): SplitVm => {
      const primary = terminalSessions.find((s) => s.id === activeId) ?? null;
      const validSecondary =
        secondaryId &&
        secondaryId !== activeId &&
        terminalSessions.some((s) => s.id === secondaryId);
      const resolvedSecondaryId = validSecondary
        ? secondaryId
        : (terminalSessions.find((s) => s.id !== activeId)?.id ?? null);

      const secondary =
        terminalSessions.find((s) => s.id === resolvedSecondaryId) ?? null;
      const secondaryOptions = terminalSessions.filter((s) => s.id !== activeId);
      const splitEnabled =
        splitMode !== "off" &&
        Boolean(activeId) &&
        Boolean(resolvedSecondaryId) &&
        resolvedSecondaryId !== activeId;

      return {
        splitMode,
        secondaryId: resolvedSecondaryId,
        splitEnabled,
        primary,
        secondary,
        secondaryOptions,
        activeId,
      };
    }),
  );

  ngOnInit() {
    combineLatest([this.sessions.sessionsStream$, this.sessions.activeSessionIdStream$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([allSessions, activeId]) => {
        this.syncMountedIds(allSessions, activeId);
      });

    combineLatest([
      this.terminalSessions$,
      this.sessions.activeSessionIdStream$,
      this.layout.splitModeStream$,
      this.layout.secondarySessionIdStream$,
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([terminalSessions, activeId, splitMode, secondaryId]) => {
        if (splitMode === "off" || !activeId) return;
        const valid =
          secondaryId &&
          secondaryId !== activeId &&
          terminalSessions.some((s) => s.id === secondaryId);
        if (valid) return;
        const pick = terminalSessions.find((s) => s.id !== activeId)?.id ?? null;
        if (pick !== secondaryId) {
          this.layout.setSecondarySessionId(pick);
        }
      });

    combineLatest([this.layout.splitModeStream$, this.layout.secondarySessionIdStream$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([splitMode, secondaryId]) => {
        if (splitMode !== "off" && secondaryId) {
          this.addMounted(secondaryId);
        }
      });
  }

  onSecondaryPick(id: string) {
    if (!id) return;
    this.layout.setSecondarySessionId(id);
    this.addMounted(id);
  }

  openTerminal() {
    this.sessions.openLocalShell();
    this.nav.setView("terminal");
  }

  private addMounted(id: string) {
    const next = new Set(this.mountedIds());
    if (next.has(id)) return;
    next.add(id);
    this.mountedIds.set(next);
  }

  private syncMountedIds(allSessions: Session[], activeId: string | null) {
    const next = new Set(this.mountedIds());
    let changed = false;

    if (activeId && !next.has(activeId)) {
      next.add(activeId);
      changed = true;
    }

    for (const session of allSessions) {
      if (session.kind === "remote") continue;
      const shouldMount =
        session.kind === "local" ||
        session.sshPhase === "ready" ||
        session.sshPhase === "connecting" ||
        session.sshPhase === "failed";
      if (shouldMount && !next.has(session.id)) {
        next.add(session.id);
        changed = true;
      }
    }

    for (const id of [...next]) {
      if (!allSessions.some((s) => s.id === id)) {
        next.delete(id);
        changed = true;
      }
    }

    if (changed) {
      this.mountedIds.set(next);
    }
  }
}
