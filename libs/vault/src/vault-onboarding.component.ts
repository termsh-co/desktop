import { Component, inject, output, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { TermshIconComponent, TermshLogoComponent } from "@termsh/angular";
import { VaultSetupModalComponent } from "./vault-setup-modal.component";

export type VaultOnboardingContinue = {
  openSyncSettings?: boolean;
};

@Component({
  selector: "termsh-vault-onboarding",
  standalone: true,
  imports: [TranslateModule, TermshIconComponent, TermshLogoComponent, VaultSetupModalComponent],
  template: `
    <div class="vault-onboard">
      <div class="vault-onboard__drag" aria-hidden="true"></div>

      <div class="vault-onboard__panel">
        <header class="vault-onboard__hero">
          <div class="vault-onboard__app-icon" aria-hidden="true">
            <termsh-logo variant="mark" [size]="30" />
          </div>
          <div class="vault-onboard__hero-text">
            <h1 class="vault-onboard__title">{{ 'vault.onboarding.title' | translate }}</h1>
            <p class="vault-onboard__subtitle">{{ 'vault.onboarding.chooseSubtitle' | translate }}</p>
          </div>
        </header>

        <div class="vault-onboard__list-panel">
          <section class="vault-onboard__item">
            <div class="vault-onboard__item-head">
              <span class="vault-onboard__item-icon" aria-hidden="true">
                <termsh-icon name="lock" [size]="18" />
              </span>
              <div class="vault-onboard__item-copy">
                <h2 class="vault-onboard__item-title">{{ 'vault.onboarding.localTitle' | translate }}</h2>
                <p class="vault-onboard__item-lead">{{ 'vault.onboarding.localLead' | translate }}</p>
              </div>
            </div>
            <ul class="vault-onboard__bullets">
              <li>{{ 'vault.protects.passwords' | translate }}</li>
              <li>{{ 'vault.protects.keys' | translate }}</li>
              <li>{{ 'vault.protects.snippets' | translate }}</li>
            </ul>
            <button
              type="button"
              class="btn btn--primary vault-onboard__item-btn"
              (click)="openSetup('local')"
            >
              {{ 'vault.onboarding.setupButton' | translate }}
            </button>
          </section>

          <section class="vault-onboard__item">
            <div class="vault-onboard__item-head">
              <span class="vault-onboard__item-icon" aria-hidden="true">
                <termsh-icon name="cloud" [size]="18" />
              </span>
              <div class="vault-onboard__item-copy">
                <h2 class="vault-onboard__item-title">{{ 'vault.onboarding.cloudTitle' | translate }}</h2>
                <p class="vault-onboard__item-lead">{{ 'vault.onboarding.cloudLead' | translate }}</p>
                <p class="vault-onboard__note">{{ 'vault.onboarding.cloudRequiresVault' | translate }}</p>
              </div>
            </div>
            <button
              type="button"
              class="btn btn--ghost vault-onboard__item-btn"
              (click)="openSetup('cloud')"
            >
              {{ 'vault.onboarding.cloudSetupButton' | translate }}
            </button>
          </section>
        </div>

        <p class="vault-onboard__skip">
          <button type="button" class="vault-onboard__skip-link" (click)="skip()">
            {{ 'vault.onboarding.skipButton' | translate }}
          </button>
        </p>
      </div>
    </div>

    <termsh-vault-setup-modal
      [open]="setupOpen()"
      (close)="setupOpen.set(false)"
      (success)="onSetupSuccess()"
    />
  `,
})
export class VaultOnboardingComponent {
  readonly continue = output<VaultOnboardingContinue | undefined>();

  readonly setupOpen = signal(false);
  private afterVault: "local" | "cloud" = "local";

  openSetup(path: "local" | "cloud") {
    this.afterVault = path;
    this.setupOpen.set(true);
  }

  skip() {
    this.continue.emit(undefined);
  }

  onSetupSuccess() {
    this.setupOpen.set(false);
    this.continue.emit(
      this.afterVault === "cloud" ? { openSyncSettings: true } : undefined,
    );
  }
}
