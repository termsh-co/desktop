import { AsyncPipe } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import {
  SSH_IDLE_TIMEOUT_VALUES,
  THEME_IDS,
  type SshIdleTimeoutMinutes,
  type ThemeId,
} from "@termsh/common";
import { TermshPlatformService } from "@termsh/platform";
import {
  SettingsStateService,
  SyncStateService,
  UpdaterStateService,
  type AppLocale,
} from "@termsh/state";

@Component({
  selector: "termsh-settings-view",
  standalone: true,
  imports: [AsyncPipe, FormsModule, TranslateModule],
  template: `
    <div class="view">
      <header class="view__head">
        <h1>{{ 'settings.title' | translate }}</h1>
      </header>
      <div class="view__scroll mac-scrollbar settings-form">
        <section class="settings-section">
          <h2 class="settings-section__title">{{ 'settings.language.title' | translate }}</h2>
          <p class="settings-section__desc">{{ 'settings.language.desc' | translate }}</p>
          <div class="settings-field">
            <label class="settings-field__label" for="locale">{{ 'settings.language.label' | translate }}</label>
            <select
              id="locale"
              class="settings-field__select"
              [ngModel]="settings.snapshot.locale"
              (ngModelChange)="onLocale($event)"
              name="locale"
            >
              @for (loc of locales; track loc) {
                <option [value]="loc">{{ loc }}</option>
              }
            </select>
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section__title">{{ 'settings.theme.title' | translate }}</h2>
          <p class="settings-section__desc">{{ 'settings.theme.desc' | translate }}</p>
          <div class="settings-field">
            <label class="settings-field__label" for="theme">{{ 'settings.theme.title' | translate }}</label>
            <select
              id="theme"
              class="settings-field__select"
              [ngModel]="settings.snapshot.themeId"
              (ngModelChange)="onTheme($event)"
              name="theme"
            >
              @for (theme of themeIds; track theme) {
                <option [value]="theme">{{ ('settings.theme.names.' + theme) | translate }}</option>
              }
            </select>
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section__title">{{ 'settings.terminal.title' | translate }}</h2>
          <div class="settings-field">
            <label class="settings-field__label" for="fontSize">{{ 'settings.terminal.sizeLabel' | translate }}</label>
            <input
              id="fontSize"
              class="settings-field__input"
              type="number"
              min="11"
              max="18"
              [ngModel]="settings.snapshot.terminalFontSize"
              (ngModelChange)="onFontSize($event)"
              name="fontSize"
            />
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section__title">{{ 'settings.security.title' | translate }}</h2>
          <p class="settings-section__desc">{{ 'settings.security.desc' | translate }}</p>
          <div class="settings-field">
            <label class="settings-field__label" for="ssh-idle-timeout">{{ 'settings.security.idleLabel' | translate }}</label>
            <select
              id="ssh-idle-timeout"
              class="settings-field__select"
              [ngModel]="settings.snapshot.sshIdleTimeoutMinutes"
              (ngModelChange)="onSshIdle($event)"
              name="sshIdle"
            >
              @for (opt of sshIdleOptions; track opt) {
                <option [value]="opt">{{ ('settings.sshIdle.' + opt) | translate }}</option>
              }
            </select>
          </div>
          <div class="settings-field">
            <label class="settings-field__label" for="vaultAutoLock">{{ 'settings.vaultAutoLock.label' | translate }}</label>
            <select
              id="vaultAutoLock"
              class="settings-field__select"
              [ngModel]="settings.snapshot.vaultAutoLockMinutes"
              (ngModelChange)="onVaultAutoLock($event)"
              name="vaultAutoLock"
            >
              @for (opt of vaultAutoLockOptions; track opt) {
                <option [value]="opt">{{ ('settings.vaultAutoLock.' + opt) | translate }}</option>
              }
            </select>
          </div>
        </section>

        <section class="settings-section">
          <h2 class="settings-section__title">{{ 'settings.sync.title' | translate }}</h2>
          <p class="settings-section__desc">{{ 'settings.sync.desc' | translate }}</p>
          <div class="settings-field">
            <label class="settings-field__label" for="sync-url">{{ 'settings.sync.serverUrl' | translate }}</label>
            <input
              id="sync-url"
              class="settings-field__input"
              type="url"
              [ngModel]="sync.snapshot.serverUrl"
              (ngModelChange)="sync.setServerUrl($event)"
              [placeholder]="'settings.sync.serverUrlPlaceholder' | translate"
              name="syncUrl"
            />
          </div>
          <div class="settings-field">
            <label class="settings-field__label" for="sync-token">{{ 'settings.sync.accessToken' | translate }}</label>
            <input
              id="sync-token"
              class="settings-field__input"
              type="password"
              [ngModel]="sync.snapshot.accessToken"
              (ngModelChange)="sync.setAccessToken($event)"
              [placeholder]="'settings.sync.accessTokenPlaceholder' | translate"
              name="syncToken"
            />
          </div>
          @if (sync.statusStream$ | async; as syncStatus) {
            <p
              class="settings-sync-status"
              [class.settings-sync-status--ok]="syncStatus.connected"
            >
              {{
                syncStatus.connected
                  ? ('settings.sync.connectedAs' | translate : { email: syncStatus.email })
                  : ('settings.sync.notConnected' | translate)
              }}
            </p>
          }
          @if (sync.errorStream$ | async; as syncError) {
            <p class="settings-sync-error">{{ formatSyncError(syncError) }}</p>
          }
          <div class="settings-actions">
            <button
              type="button"
              class="btn btn--ghost"
              [disabled]="(sync.syncingStream$ | async) || !sync.snapshot.serverUrl || !sync.snapshot.accessToken"
              (click)="checkSync()"
            >
              {{ 'settings.sync.testConnection' | translate }}
            </button>
            @if ((sync.statusStream$ | async)?.connected) {
              <button type="button" class="btn btn--ghost" [disabled]="sync.syncingStream$ | async" (click)="pullSync()">
                {{ 'settings.sync.pull' | translate }}
              </button>
              <button type="button" class="btn btn--ghost" [disabled]="sync.syncingStream$ | async" (click)="pushSync()">
                {{ 'settings.sync.push' | translate }}
              </button>
            }
          </div>
          <label class="settings-field vault-field--checkbox">
            <input
              type="checkbox"
              [ngModel]="sync.snapshot.enabled"
              (ngModelChange)="onSyncEnabled($event)"
            />
            <span>{{ 'settings.sync.title' | translate }}</span>
          </label>
          <label class="settings-field vault-field--checkbox">
            <input
              type="checkbox"
              [ngModel]="sync.snapshot.autoSync"
              (ngModelChange)="sync.setAutoSync($event)"
            />
            <span>{{ 'settings.sync.autoSync' | translate }}</span>
          </label>
        </section>

        <section class="settings-section">
          <h2 class="settings-section__title">{{ 'settings.updates.title' | translate }}</h2>
          <p class="settings-section__desc">{{ 'settings.updates.desc' | translate }}</p>
          <div class="settings-field">
            <span class="settings-field__label">{{ 'settings.updates.version' | translate }}</span>
            <span class="settings-field__value">{{ appVersion ?? '—' }}</span>
          </div>
          <div class="settings-field">
            <span class="settings-field__label">{{ 'settings.updates.coreEngine' | translate }}</span>
            <span class="settings-field__value">{{ coreVersion ?? '—' }}</span>
          </div>
          @if (updater.lastMessageStream$ | async; as updateMsg) {
            <p class="settings-sync-status">{{ formatUpdateMessage(updateMsg) }}</p>
          }
          @if (updater.updateAvailableStream$ | async) {
            <p class="settings-sync-status settings-sync-status--ok">
              {{ 'settings.updates.updateAvailable' | translate : { version: updater.updateVersion ?? '' } }}
            </p>
          }
          <div class="settings-actions">
            <button
              type="button"
              class="btn btn--ghost"
              [disabled]="(updater.checkingStream$ | async) || (updater.installingStream$ | async)"
              (click)="checkUpdates()"
            >
              {{
                (updater.checkingStream$ | async)
                  ? ('settings.updates.checking' | translate)
                  : ('settings.updates.checkForUpdates' | translate)
              }}
            </button>
            @if (updater.updateAvailable) {
              <button
                type="button"
                class="btn btn--primary"
                [disabled]="updater.installingStream$ | async"
                (click)="installUpdate()"
              >
                {{
                  (updater.installingStream$ | async)
                    ? ('settings.updates.installing' | translate)
                    : ('settings.updates.install' | translate)
                }}
              </button>
            }
          </div>
        </section>
      </div>
    </div>
  `,
})
export class SettingsViewComponent implements OnInit {
  readonly settings = inject(SettingsStateService);
  readonly sync = inject(SyncStateService);
  readonly updater = inject(UpdaterStateService);
  private readonly translate = inject(TranslateService);
  private readonly platform = inject(TermshPlatformService);

  appVersion: string | null = null;
  coreVersion: string | null = null;

  readonly locales: AppLocale[] = ["en", "tr", "de", "es", "zh"];
  readonly themeIds = THEME_IDS;
  readonly vaultAutoLockOptions = [0, 5, 15, 30, 60];
  readonly sshIdleOptions = SSH_IDLE_TIMEOUT_VALUES;

  ngOnInit() {
    document.documentElement.dataset.theme = this.settings.snapshot.themeId;
    if (this.settings.snapshot.cloudSyncEnabled && !this.sync.snapshot.enabled) {
      this.sync.setEnabled(true);
    }
    void this.platform.appInfo.then((info) => {
      this.appVersion = info.version;
    });
    void this.platform.coreVersion.then((version) => {
      this.coreVersion = version;
    });
  }

  onLocale(locale: AppLocale) {
    this.settings.setLocale(locale);
    void this.translate.use(locale);
  }

  onTheme(themeId: ThemeId) {
    this.settings.setThemeId(themeId);
  }

  onFontSize(size: number) {
    this.settings.setTerminalFontSize(Number(size));
  }

  onVaultAutoLock(minutes: number) {
    const value = Number(minutes);
    this.settings.setVaultAutoLockMinutes(value);
    void this.platform.setAutoLockMinutes(value);
  }

  onSshIdle(minutes: number) {
    this.settings.setSshIdleTimeoutMinutes(Number(minutes) as SshIdleTimeoutMinutes);
  }

  onSyncEnabled(enabled: boolean) {
    this.sync.setEnabled(enabled);
    this.settings.setCloudSyncEnabled(enabled);
  }

  checkSync() {
    void this.sync.checkStatus();
  }

  pullSync() {
    void this.sync.pull();
  }

  pushSync() {
    void this.sync.push();
  }

  formatSyncError(message: string): string {
    if (message.startsWith("settings.")) {
      return this.translate.instant(message);
    }
    return message;
  }

  checkUpdates() {
    void this.updater.check({ notify: false });
  }

  installUpdate() {
    void this.updater.install();
  }

  formatUpdateMessage(message: string): string {
    if (message.startsWith("settings.") || message.startsWith("updater.")) {
      return this.translate.instant(message);
    }
    return message;
  }
}
