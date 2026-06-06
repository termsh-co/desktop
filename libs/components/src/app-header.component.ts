import { AsyncPipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { NavStateService, SyncStateService, UpdaterStateService, VaultStateService } from "@termsh/state";
import { TermshIconComponent } from "@termsh/angular";

@Component({
  selector: "termsh-app-header",
  standalone: true,
  imports: [AsyncPipe, TranslateModule, TermshIconComponent],
  template: `
    <header class="app-header">
      <div class="app-header__spacer" aria-hidden="true"></div>

      <button
        type="button"
        class="app-header__home"
        (click)="nav.setView('hosts')"
        title="Home"
      >
        <termsh-icon name="home" [size]="16" />
      </button>

      <div class="header-segment" role="radiogroup" aria-label="Server type">
        <button
          type="button"
          role="radio"
          class="header-segment__btn"
          [class.header-segment__btn--active]="serverSegment() === 'ssh'"
          [attr.aria-checked]="serverSegment() === 'ssh'"
          (click)="setSegment('ssh')"
        >
          <termsh-icon name="terminal" [size]="12" />
          Host
        </button>
        <button
          type="button"
          role="radio"
          class="header-segment__btn"
          [class.header-segment__btn--active]="serverSegment() === 'sftp'"
          [attr.aria-checked]="serverSegment() === 'sftp'"
          (click)="setSegment('sftp')"
        >
          <termsh-icon name="folder" [size]="12" />
          SFTP
        </button>
        <span
          class="header-segment__indicator"
          [style.transform]="serverSegment() === 'sftp' ? 'translateX(100%)' : 'translateX(0)'"
        ></span>
      </div>

      <div class="app-header__search-wrap">
        <div class="header-search">
          <span class="header-search__icon" aria-hidden="true">
            <termsh-icon name="search" [size]="14" />
          </span>
          <input
            class="header-search__input"
            type="search"
            [placeholder]="'palette.searchPlaceholder' | translate"
            spellcheck="false"
            autocomplete="off"
            (focus)="nav.openPalette()"
            (click)="nav.openPalette()"
            readonly
          />
          <kbd class="header-search__kbd" (click)="nav.openPalette()">⌘K</kbd>
        </div>
      </div>

      <div class="app-header__actions">
        @if (sync.statusStream$ | async; as syncStatus) {
          <button
            type="button"
            class="app-header__action app-header__action--cloud"
            [class.app-header__action--cloud-off]="!sync.snapshot.enabled || !syncStatus.connected"
            [attr.aria-label]="
              !sync.snapshot.enabled
                ? ('common.status.syncOff' | translate)
                : syncStatus.connected
                  ? ('common.status.syncConnected' | translate : { email: syncStatus.email })
                  : ('common.status.syncNoConnection' | translate)
            "
            title="Sync"
            (click)="openSyncSettings()"
          >
            <termsh-icon
              [name]="sync.snapshot.enabled && syncStatus.connected ? 'cloud' : 'cloud_off'"
              [size]="17"
            />
          </button>
        }
        <button
          type="button"
          class="app-header__action app-header__action--bell"
          [class.app-header__action--bell-active]="updater.updateAvailable"
          [title]="updateBellTitle"
          [attr.aria-label]="updateBellTitle"
          (click)="onUpdateBell()"
          (contextmenu)="onUpdateDismiss($event)"
        >
          <termsh-icon name="bell" [size]="17" />
          @if (updater.updateAvailable) {
            <span class="app-header__badge" aria-hidden="true"></span>
          }
        </button>
        <button
          type="button"
          class="app-header__action"
          (click)="onVault()"
          title="Vault"
        >
          <termsh-icon [name]="vaultReady ? 'lock_open' : 'lock'" [size]="17" />
        </button>
        <div class="app-header__avatar" title="Account">
          <termsh-icon name="key" [size]="16" />
        </div>
      </div>
    </header>
  `,
})
export class AppHeaderComponent {
  readonly nav = inject(NavStateService);
  private readonly vault = inject(VaultStateService);
  readonly sync = inject(SyncStateService);
  readonly updater = inject(UpdaterStateService);
  readonly serverSegment = signal<"ssh" | "sftp">("ssh");

  get updateBellTitle(): string {
    if (this.updater.updateAvailable) {
      return `Update ready: ${this.updater.updateVersion ?? ""}`;
    }
    return "Check for updates";
  }

  get vaultReady(): boolean {
    const s = this.vault.status;
    return Boolean(s?.isSetup && s.isUnlocked);
  }

  setSegment(segment: "ssh" | "sftp") {
    this.serverSegment.set(segment);
    this.nav.setView(segment === "sftp" ? "remote" : "hosts");
  }

  openSyncSettings() {
    this.nav.setView("settings");
  }

  onVault() {
    const s = this.vault.status;
    if (s?.isSetup && s.isUnlocked) void this.vault.lock();
    else this.nav.setView("vault");
  }

  onUpdateBell() {
    if (this.updater.updateAvailable) {
      void this.updater.install();
      return;
    }
    void this.updater.check({ notify: true });
  }

  onUpdateDismiss(event: MouseEvent) {
    if (!this.updater.updateAvailable) return;
    event.preventDefault();
    this.updater.dismiss();
  }
}
