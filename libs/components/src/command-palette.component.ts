import { Component, HostListener, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import type { Host } from "@termsh/common";
import {
  HostStateService,
  NavStateService,
  SessionStateService,
  VaultStateService,
} from "@termsh/state";

type PaletteAction = {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
};

@Component({
  selector: "termsh-command-palette",
  standalone: true,
  imports: [FormsModule, TranslateModule],
  template: `
    @if (nav.paletteOpen) {
      <div class="palette-backdrop" (click)="nav.closePalette()">
        <div
          class="palette"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="'palette.commandPaletteAria' | translate"
          (click)="$event.stopPropagation()"
        >
          <input
            class="palette__input"
            type="search"
            [(ngModel)]="query"
            [placeholder]="'palette.palettePlaceholder' | translate"
            [attr.aria-label]="'palette.searchAria' | translate"
          />
          <ul class="palette__list mac-scrollbar">
            @if (filteredActions().length === 0) {
              <li class="palette__empty">{{ 'palette.empty' | translate }}</li>
            }
            @for (action of filteredActions(); track action.id) {
              <li>
                <button type="button" class="palette__item" (click)="run(action)">
                  <span>{{ action.label }}</span>
                  @if (action.hint) {
                    <span class="palette__hint">{{ action.hint }}</span>
                  }
                </button>
              </li>
            }
          </ul>
          <p class="palette__foot">{{ 'palette.paletteFoot' | translate }}</p>
        </div>
      </div>
    }
  `,
})
export class CommandPaletteComponent {
  readonly nav = inject(NavStateService);
  private readonly hosts = inject(HostStateService);
  private readonly sessions = inject(SessionStateService);
  private readonly vault = inject(VaultStateService);
  private readonly t = inject(TranslateService);

  query = "";

  private buildActions(hostList: Host[]): PaletteAction[] {
    const screen = this.t.instant("palette.hintScreen");
    const go = (view: Parameters<NavStateService["setView"]>[0], after?: () => void) => {
      this.nav.setView(view);
      after?.();
    };

    const nav: PaletteAction[] = [
      { id: "nav-hosts", label: this.t.instant("palette.nav.hosts"), hint: screen, run: () => go("hosts") },
      {
        id: "nav-terminal",
        label: this.t.instant("palette.nav.terminal"),
        hint: screen,
        run: () =>
          go("terminal", () => {
            if (this.sessions.sessions.length === 0) this.sessions.openLocalShell();
          }),
      },
      { id: "nav-snippets", label: this.t.instant("palette.nav.snippets"), hint: screen, run: () => go("snippets") },
      { id: "nav-vault", label: this.t.instant("palette.nav.vault"), hint: screen, run: () => go("vault") },
      { id: "nav-keys", label: this.t.instant("palette.nav.keys"), hint: screen, run: () => go("keys") },
      { id: "nav-settings", label: this.t.instant("palette.nav.settings"), hint: screen, run: () => go("settings") },
      {
        id: "new-host",
        label: this.t.instant("palette.newHost"),
        run: () => this.nav.openHostDrawer(null),
      },
      {
        id: "vault-lock",
        label: this.t.instant("palette.vaultActions"),
        run: () => {
          const s = this.vault.status;
          if (s?.isSetup && s.isUnlocked) void this.vault.lock();
          else go("vault");
        },
      },
    ];

    const hostActions: PaletteAction[] = hostList.map((h) => ({
      id: `host-${h.id}`,
      label: this.t.instant("palette.connect", { name: h.name }),
      hint: `${h.username}@${h.hostname}`,
      run: () => go("terminal", () => this.sessions.openSshSession(h)),
    }));

    return [...nav, ...hostActions];
  }

  filteredActions(): PaletteAction[] {
    const q = this.query.trim().toLowerCase();
    const actions = this.buildActions(this.hosts.hosts);
    if (!q) return actions.slice(0, 12);
    return actions
      .filter((a) => a.label.toLowerCase().includes(q) || a.hint?.toLowerCase().includes(q))
      .slice(0, 12);
  }

  run(action: PaletteAction) {
    action.run();
    this.nav.closePalette();
    this.query = "";
  }

  @HostListener("document:keydown", ["$event"])
  onKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (this.nav.paletteOpen) this.nav.closePalette();
      else this.nav.openPalette();
    }
    if (event.key === "Escape" && this.nav.paletteOpen) {
      this.nav.closePalette();
    }
  }
}
