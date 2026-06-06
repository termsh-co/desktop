import { Component, effect, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { TermshIconComponent, TermshLogoComponent } from "@termsh/angular";
import type { VaultUnlockOptions } from "@termsh/platform";
import { VaultStateService } from "@termsh/state";
import { biometricIcon, biometricLabelKey } from "./biometric";
import { SecretInputComponent } from "./secret-input.component";

@Component({
  selector: "termsh-unlock-view",
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    TermshLogoComponent,
    TermshIconComponent,
    SecretInputComponent,
  ],
  template: `
    @if (vault.status?.isSetup) {
      <div class="vault-unlock">
        <div class="vault-unlock__drag" aria-hidden="true"></div>
        <div class="vault-unlock__panel">
          <header class="vault-unlock__hero">
            <div class="vault-unlock__app-icon" aria-hidden="true">
              <termsh-logo variant="mark" [size]="30" />
            </div>
            <div class="vault-unlock__hero-text">
              <h1 class="vault-unlock__title">{{ 'vault.unlock.title' | translate }}</h1>
              <p class="vault-unlock__subtitle">{{ 'vault.unlock.subtitle' | translate }}</p>
            </div>
          </header>

          @if (error()) {
            <p class="vault-unlock__error" role="alert">{{ error() }}</p>
          }

          @if (vault.status?.biometricEnabled) {
            <button
              type="button"
              class="vault-unlock__biometric"
              [disabled]="busy()"
              (click)="onBiometricUnlock()"
            >
              <termsh-icon [name]="biometricIconName()" [size]="22" />
              <span>{{
                'vault.unlock.biometricButton'
                  | translate: { method: (biometricMethodLabel() | translate) }
              }}</span>
            </button>
          }

          <form class="vault-unlock__form" (ngSubmit)="submit()">
            <termsh-secret-input
              variant="unlock"
              [(value)]="password"
              name="password"
              [label]="'vault.unlock.masterPassword' | translate"
              [placeholder]="'vault.unlock.placeholder' | translate"
              autocomplete="current-password"
              [required]="true"
            />

            @if (showDeviceUnlockOption()) {
              <label class="vault-unlock__remember">
                <input
                  type="checkbox"
                  name="useDeviceUnlock"
                  [(ngModel)]="useDeviceUnlock"
                />
                <span>
                  @if (vault.status?.biometricAvailable) {
                    {{
                      'vault.unlock.useBiometric'
                        | translate: { method: (biometricMethodLabel() | translate) }
                    }}
                  } @else {
                    {{ 'vault.unlock.rememberKeychain' | translate }}
                  }
                </span>
              </label>
            }

            <button
              type="submit"
              class="vault-unlock__submit"
              [disabled]="busy() || password.length < 8"
            >
              {{
                (busy() ? 'vault.unlock.unlocking' : 'vault.unlock.unlockButton') | translate
              }}
            </button>
          </form>
        </div>

        <p class="vault-unlock__footnote">{{ 'vault.unlock.footnote' | translate }}</p>
      </div>
    } @else {
      <div class="vault-screen">
        <div class="vault-card">
          <div class="vault-card__brand">
            <termsh-logo variant="wordmark" [size]="32" />
          </div>
          <h1>{{ 'vault.setup.title' | translate }}</h1>
          <p class="vault-card__lead">{{ 'vault.setup.lead' | translate }}</p>
          <form class="vault-form" (ngSubmit)="submit()">
            <termsh-secret-input
              [(value)]="password"
              name="password"
              [label]="'vault.setup.masterPassword' | translate"
              [placeholder]="'vault.unlock.placeholder' | translate"
              autocomplete="new-password"
              [required]="true"
            />

            @if (showDeviceUnlockOption()) {
              <label class="vault-unlock__remember">
                <input
                  type="checkbox"
                  name="useDeviceUnlock"
                  [(ngModel)]="useDeviceUnlock"
                />
                <span>
                  @if (vault.status?.biometricAvailable) {
                    {{
                      'vault.setup.useBiometric'
                        | translate: { method: (biometricMethodLabel() | translate) }
                    }}
                  } @else {
                    {{ 'vault.setup.rememberKeychain' | translate }}
                  }
                </span>
              </label>
            }

            @if (error()) {
              <p class="vault-card__error">{{ error() }}</p>
            }
            <button type="submit" class="btn btn--primary" [disabled]="busy() || password.length < 8">
              {{ 'vault.setup.createButton' | translate }}
            </button>
          </form>
        </div>
      </div>
    }
  `,
})
export class UnlockViewComponent {
  readonly vault = inject(VaultStateService);

  password = "";
  useDeviceUnlock = true;
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  private autoTried = false;

  constructor() {
    effect(() => {
      const status = this.vault.status;
      if (this.autoTried || !status) return;
      if (!status.biometricEnabled && !status.keychainEnabled) return;
      this.autoTried = true;
      this.busy.set(true);
      void this.vault.bootstrap().finally(() => this.busy.set(false));
    });
  }

  biometricIconName() {
    return biometricIcon(this.vault.status?.biometricKind ?? "none");
  }

  biometricMethodLabel() {
    return biometricLabelKey(this.vault.status?.biometricKind ?? "generic");
  }

  showDeviceUnlockOption(): boolean {
    const status = this.vault.status;
    if (!status) return false;
    return Boolean(status.biometricAvailable || status.keychainAvailable);
  }

  unlockOptions(): VaultUnlockOptions {
    const status = this.vault.status;
    return {
      useBiometric: Boolean(status?.biometricAvailable && this.useDeviceUnlock),
      rememberInKeychain: Boolean(
        !status?.biometricAvailable && status?.keychainAvailable && this.useDeviceUnlock,
      ),
    };
  }

  async onBiometricUnlock() {
    this.vault.clearError();
    this.error.set(null);
    this.busy.set(true);
    try {
      await this.vault.unlockWithBiometric();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busy.set(false);
    }
  }

  async submit() {
    if (!this.password || this.busy()) return;
    this.vault.clearError();
    this.error.set(null);
    this.busy.set(true);
    try {
      if (this.vault.status?.isSetup) {
        await this.vault.unlock(this.password, this.unlockOptions());
      } else {
        await this.vault.setup(this.password, this.unlockOptions());
      }
      this.password = "";
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busy.set(false);
    }
  }
}
