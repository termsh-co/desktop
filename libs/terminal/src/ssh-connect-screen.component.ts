import { Component, inject, Input, OnChanges, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import type { Host, Session } from "@termsh/common";
import { TermshPlatformService } from "@termsh/platform";
import {
  HostStateService,
  NavStateService,
  SessionStateService,
  VaultStateService,
} from "@termsh/state";
import { SecretInputComponent } from "@termsh/vault";

@Component({
  selector: "termsh-ssh-connect-screen",
  standalone: true,
  imports: [FormsModule, TranslateModule, SecretInputComponent],
  template: `
    <div class="connect-screen" [class.connect-screen--active]="active">
      <div class="connect-card">
        <header class="connect-card__head">
          <h2>{{ host?.name ?? ('terminal.connect.hostNotFound' | translate) }}</h2>
          @if (host) {
            <p class="connect-card__addr">{{ host.username }}&#64;{{ host.hostname }}</p>
          }
        </header>

        @if (!host) {
          <p class="connect-card__error">{{ 'terminal.connect.hostNotFound' | translate }}</p>
        } @else if (phase === 'failed') {
          <p class="connect-card__error">{{ errorMessage }}</p>
        }

        @if (host && showPasswordForm) {
          <form class="connect-card__form" (ngSubmit)="connect()">
            <termsh-secret-input
              [label]="'terminal.connect.passwordLabel' | translate"
              name="password"
              [(value)]="password"
              [placeholder]="hasStoredPassword
                ? ('terminal.connect.passwordPlaceholderStored' | translate)
                : ('terminal.connect.passwordPlaceholderEnter' | translate)"
              autocomplete="current-password"
            />
            <p class="connect-card__hint">{{ 'terminal.connect.hint' | translate }}</p>
          </form>
        }

        <footer class="connect-card__footer">
          @if (host) {
            <button type="button" class="btn btn--ghost" (click)="editHost()">
              {{ 'terminal.connect.editHost' | translate }}
            </button>
            @if (phase === 'failed') {
              <button type="button" class="btn btn--ghost" (click)="retry()">
                {{ 'terminal.connect.retry' | translate }}
              </button>
            }
            <button
              type="button"
              class="btn btn--primary"
              [disabled]="connecting() || !canConnect"
              (click)="connect()"
            >
              {{ connecting() ? ('terminal.connect.connectingButton' | translate) : ('terminal.connect.connectButton' | translate) }}
            </button>
          }
        </footer>
      </div>
    </div>
  `,
})
export class SshConnectScreenComponent implements OnChanges {
  @Input({ required: true }) session!: Session;
  @Input() active = false;

  private readonly hosts = inject(HostStateService);
  private readonly sessions = inject(SessionStateService);
  private readonly nav = inject(NavStateService);
  private readonly vault = inject(VaultStateService);
  private readonly platform = inject(TermshPlatformService);

  readonly connecting = signal(false);
  password = "";
  private autoStarted = false;

  get host(): Host | undefined {
    return this.hosts.hosts.find((h) => h.id === this.session.hostId);
  }

  get phase() {
    return this.session.sshPhase ?? "connecting";
  }

  get vaultReady(): boolean {
    const s = this.vault.status;
    return Boolean(s?.isSetup && s.isUnlocked);
  }

  get isPasswordHost(): boolean {
    return this.host?.authType === "password";
  }

  get hasStoredPassword(): boolean {
    return Boolean(this.host?.credentialRef);
  }

  get needsPasswordInput(): boolean {
    return this.isPasswordHost && !this.hasStoredPassword;
  }

  get showPasswordForm(): boolean {
    return this.isPasswordHost && (this.needsPasswordInput || this.phase === "failed");
  }

  get canConnect(): boolean {
    if (!this.host) return false;
    if (this.needsPasswordInput && !this.password.trim()) return false;
    const needsVault = Boolean(this.host.credentialRef || this.host.privateKeyRef);
    if (needsVault && !this.vaultReady) return false;
    return true;
  }

  get errorMessage(): string {
    return this.session.sshError ?? "";
  }

  ngOnChanges() {
    if (this.canAutoConnect()) {
      void this.runConnect();
    }
  }

  private canAutoConnect(): boolean {
    if (!this.active || !this.host || this.phase !== "connecting") return false;
    if (this.autoStarted) return false;
    if (this.isPasswordHost && (this.needsPasswordInput || !this.vaultReady && this.hasStoredPassword)) {
      return false;
    }
    const needsVault = Boolean(this.host.credentialRef || this.host.privateKeyRef);
    if (needsVault && !this.vaultReady) return false;
    return this.host.authType === "privateKey" || this.hasStoredPassword;
  }

  async connect() {
    await this.runConnect(this.password.trim() || undefined);
  }

  retry() {
    this.sessions.markSshConnecting(this.session.id);
    void this.runConnect(this.password.trim() || undefined);
  }

  editHost() {
    if (this.host) this.nav.openHostDrawer(this.host);
  }

  private waitForSshBanner(timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsub();
        reject(new Error("Connection timed out"));
      }, timeoutMs);
      const unsub = this.platform.onPtyData(({ sessionId }) => {
        if (sessionId !== this.session.id) return;
        clearTimeout(timer);
        unsub();
        resolve();
      });
    });
  }

  private async runConnect(passwordOverride?: string) {
    const host = this.host;
    if (!host) return;

    const needsVault = Boolean(host.credentialRef || host.privateKeyRef);
    if (needsVault && !this.vaultReady) {
      this.sessions.markSshFailed(this.session.id, "Vault is locked");
      return;
    }

    if (this.needsPasswordInput && !passwordOverride) {
      this.sessions.markSshFailed(this.session.id, "Password required");
      return;
    }

    this.autoStarted = true;
    this.connecting.set(true);
    this.sessions.markSshConnecting(this.session.id);

    try {
      await this.platform.spawnSshShell(this.session.id, host.id, 120, 32, passwordOverride);
      await this.waitForSshBanner(30_000);
      this.sessions.markSshReady(this.session.id);
      void this.hosts.detectPlatformAfterConnect(host.id, passwordOverride);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.sessions.markSshFailed(this.session.id, msg);
    } finally {
      this.connecting.set(false);
    }
  }
}
