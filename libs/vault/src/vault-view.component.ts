import { Component, inject } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { NavStateService, VaultStateService } from "@termsh/state";
import { biometricLabelKey } from "./biometric";

@Component({
  selector: "termsh-vault-view",
  standalone: true,
  imports: [TranslateModule],
  template: `
    <div class="view view--vault">
      <header class="view__head">
        <h1>{{ 'vault.title' | translate }}</h1>
        <p class="view__sub">{{ 'vault.subtitle' | translate }}</p>
      </header>

      <div class="view__scroll mac-scrollbar">
        <div class="vault-panel">
          <div class="vault-panel__status-row">
            <span
              class="vault-panel__dot"
              [class.vault-panel__dot--ok]="vaultReady"
              [class.vault-panel__dot--off]="!vaultReady"
              aria-hidden="true"
            ></span>
            <span>
              @if (!vault.status?.isSetup) {
                {{ 'vault.status.notSetup' | translate }}
              } @else if (vaultReady) {
                {{ 'vault.status.unlocked' | translate }}
              } @else {
                {{ 'vault.status.locked' | translate }}
              }
            </span>
          </div>

          @if (vault.status?.biometricEnabled && vault.status?.isSetup) {
            <p class="vault-panel__keychain">
              {{
                'vault.biometric.enabled'
                  | translate: { method: (biometricMethodLabel() | translate) }
              }}
            </p>
          }

          @if (
            vault.status?.keychainAvailable &&
            vault.status?.isSetup &&
            !vault.status?.biometricEnabled
          ) {
            <p class="vault-panel__keychain">
              {{
                (vault.status?.keychainEnabled
                  ? 'vault.keychain.enabled'
                  : 'vault.keychain.disabled') | translate
              }}
            </p>
          }

          <div class="vault-panel__actions">
            @if (!vault.status?.isSetup) {
              <button type="button" class="btn btn--primary" (click)="openSetup()">
                {{ 'vault.actions.setup' | translate }}
              </button>
            } @else {
              <button type="button" class="btn btn--primary" (click)="onVaultAction()">
                {{
                  (vaultReady ? 'vault.actions.lock' : 'vault.actions.unlock') | translate
                }}
              </button>
              @if (deviceUnlockEnabled) {
                <button type="button" class="btn btn--secondary" (click)="forgetDeviceUnlock()">
                  {{ 'vault.actions.forgetDeviceUnlock' | translate }}
                </button>
              }
            }
          </div>
        </div>

        <section class="view__section">
          <h2>{{ 'vault.protectsTitle' | translate }}</h2>
          <ul class="vault-feature-list">
            <li>{{ 'vault.protects.passwords' | translate }}</li>
            <li>{{ 'vault.protects.keys' | translate }}</li>
            <li>{{ 'vault.protects.snippets' | translate }}</li>
            <li>{{ 'vault.protects.kdf' | translate }}</li>
          </ul>
        </section>
      </div>
    </div>
  `,
})
export class VaultViewComponent {
  readonly vault = inject(VaultStateService);
  private readonly nav = inject(NavStateService);

  get vaultReady(): boolean {
    const s = this.vault.status;
    return Boolean(s?.isSetup && s.isUnlocked);
  }

  get deviceUnlockEnabled(): boolean {
    const s = this.vault.status;
    return Boolean(s?.biometricEnabled || s?.keychainEnabled);
  }

  biometricMethodLabel() {
    return biometricLabelKey(this.vault.status?.biometricKind ?? "generic");
  }

  openSetup() {
    this.nav.setView("vault");
  }

  onVaultAction() {
    if (this.vaultReady) {
      void this.vault.lock();
      return;
    }
    void this.vault.bootstrap();
  }

  forgetDeviceUnlock() {
    void this.vault.forgetKeychain();
  }
}
