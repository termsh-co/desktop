import { Component, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { TermshLogoComponent } from "@termsh/angular";
import type { VaultUnlockOptions } from "@termsh/platform";
import { VaultStateService } from "@termsh/state";
import { biometricLabelKey } from "./biometric";
import { SecretInputComponent } from "./secret-input.component";

@Component({
  selector: "termsh-vault-setup-modal",
  standalone: true,
  imports: [FormsModule, TranslateModule, TermshLogoComponent, SecretInputComponent],
  template: `
    @if (open()) {
      <div class="modal-backdrop" role="presentation" (click)="close.emit()">
        <div
          class="modal modal--narrow"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="'vault-setup-title'"
          (click)="$event.stopPropagation()"
        >
          <header class="modal__header modal__header--brand">
            <termsh-logo variant="wordmark-mono" [size]="26" />
            <h2 id="vault-setup-title">{{ 'vault.setup.title' | translate }}</h2>
            <button
              type="button"
              class="modal__close"
              (click)="close.emit()"
              [attr.aria-label]="'common.actions.close' | translate"
            >
              ×
            </button>
          </header>

          <form class="modal__body" (ngSubmit)="submit()">
            <p class="vault-card__lead">{{ 'vault.setup.lead' | translate }}</p>

            <termsh-secret-input
              [(value)]="password"
              name="password"
              [label]="'vault.setup.masterPassword' | translate"
              autocomplete="new-password"
              [required]="true"
            />

            <termsh-secret-input
              [(value)]="confirm"
              name="confirm"
              [label]="'vault.setup.confirmPassword' | translate"
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
              <p class="vault-card__error" role="alert">{{ error() }}</p>
            }

            <footer class="drawer__foot vault-card__actions">
              <button type="button" class="btn btn--ghost" (click)="close.emit()">
                {{ 'common.actions.cancel' | translate }}
              </button>
              <button type="submit" class="btn btn--primary" [disabled]="busy()">
                {{
                  (busy() ? 'vault.setup.creating' : 'vault.setup.createButton') | translate
                }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    }
  `,
})
export class VaultSetupModalComponent {
  readonly open = input(false);
  readonly close = output<void>();
  readonly success = output<void>();

  readonly vault = inject(VaultStateService);
  private readonly t = inject(TranslateService);

  password = "";
  confirm = "";
  useDeviceUnlock = true;
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

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

  async submit() {
    if (this.busy()) return;
    this.error.set(null);

    if (this.password !== this.confirm) {
      this.error.set(this.t.instant("vault.setup.passwordMismatch"));
      return;
    }
    if (this.password.length < 8) return;

    this.busy.set(true);
    try {
      await this.vault.setup(this.password, this.unlockOptions());
      this.password = "";
      this.confirm = "";
      this.success.emit();
      this.close.emit();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busy.set(false);
    }
  }
}
