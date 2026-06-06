import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  inject,
  viewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import type { SessionKind } from "@termsh/common";
import { TermshPlatformService } from "@termsh/platform";
import {
  ActivityTrackerService,
  SessionStateService,
  SettingsStateService,
  touchSessionActivity,
} from "@termsh/state";
import { getXtermTheme } from "./xterm-theme";

const RESIZE_DEBOUNCE_MS = 80;

@Component({
  selector: "termsh-xterm-terminal",
  standalone: true,
  template: `<div class="xterm-host" [class.xterm-host--active]="active" #host></div>`,
})
export class XtermTerminalComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly platform = inject(TermshPlatformService);
  private readonly sessions = inject(SessionStateService);
  private readonly activity = inject(ActivityTrackerService);

  @Input({ required: true }) sessionId!: string;
  @Input({ required: true }) kind!: SessionKind;
  @Input() hostId?: string;
  @Input() active = false;
  /** Focus xterm when this pane becomes the active tab. */
  @Input() focusOnActive = true;
  /** SSH PTY was started by SshConnectScreen — attach only, do not respawn. */
  @Input() sshAlreadyStarted = false;

  private readonly hostRef = viewChild.required<ElementRef<HTMLDivElement>>("host");
  private readonly settings = inject(SettingsStateService);
  private readonly destroyRef = inject(DestroyRef);

  private term: Terminal | null = null;
  private fit: FitAddon | null = null;
  private spawned = false;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private unsubData: (() => void) | null = null;
  private unsubExit: (() => void) | null = null;
  private dataDisposable: { dispose(): void } | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes["active"] && this.active && this.focusOnActive) {
      this.term?.focus();
    }
  }

  ngAfterViewInit() {
    const container = this.hostRef().nativeElement;
    const fontSize = this.settings.snapshot.terminalFontSize;
    const term = new Terminal({
      cursorBlink: true,
      fontSize,
      fontFamily: '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace',
      theme: getXtermTheme(this.settings.snapshot.themeId),
      smoothScrollDuration: 0,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);
    fitAddon.fit();

    this.term = term;
    this.fit = fitAddon;

    this.dataDisposable = term.onData((data) => {
      this.activity.ping();
      if (this.kind === "ssh") {
        touchSessionActivity(this.sessionId);
      }
      if (this.spawned) {
        this.platform.ptyWrite(this.sessionId, data);
      }
    });

    this.unsubData = this.platform.onPtyData(({ sessionId, data }) => {
      if (sessionId !== this.sessionId || !this.term) return;
      if (this.kind === "ssh") {
        touchSessionActivity(sessionId);
      }
      this.term.write(data);
    });

    this.unsubExit = this.platform.onPtyExit(({ sessionId }) => {
      if (sessionId !== this.sessionId || !this.term) return;
      this.term.writeln("\r\n\x1b[90m[session ended]\x1b[0m");
      if (this.kind === "ssh") {
        this.sessions.markSshFailed(sessionId, "Connection closed");
      }
      void this.sessions.closeSession(sessionId);
    });

    void this.startShell();

    this.resizeObserver = new ResizeObserver(() => this.scheduleFitAndResize());
    this.resizeObserver.observe(container);

    this.settings.snapshotStream$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((snap) => {
        term.options.theme = getXtermTheme(snap.themeId);
        term.options.fontSize = snap.terminalFontSize;
        this.scheduleFitAndResize();
      });
  }

  ngOnDestroy() {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.dataDisposable?.dispose();
    this.unsubData?.();
    this.unsubExit?.();
    this.resizeObserver?.disconnect();
    this.term?.dispose();
    this.term = null;
    this.fit = null;
    this.spawned = false;
  }

  private scheduleFitAndResize() {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      this.resizeTimer = null;
      const term = this.term;
      const fit = this.fit;
      if (!term || !fit) return;
      fit.fit();
      if (this.spawned) {
        this.platform.ptyResize(this.sessionId, term.cols, term.rows);
      }
    }, RESIZE_DEBOUNCE_MS);
  }

  private async startShell() {
    if (this.spawned) return;

    const term = this.term;
    const fit = this.fit;
    if (!term || !fit) return;

    fit.fit();
    try {
      if (this.kind === "ssh") {
        if (!this.sshAlreadyStarted) {
          if (!this.hostId) throw new Error("Missing host id");
          await this.platform.spawnSshShell(this.sessionId, this.hostId, term.cols, term.rows);
          this.sessions.markSshReady(this.sessionId);
        }
      } else {
        await this.platform.spawnLocalShell(this.sessionId, term.cols, term.rows);
      }
      this.spawned = true;
      term.focus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (this.kind === "ssh") {
        this.sessions.markSshFailed(this.sessionId, msg);
      }
      term.writeln(`\r\n\x1b[31mFailed to start shell:\x1b[0m ${msg}`);
    }
  }
}
