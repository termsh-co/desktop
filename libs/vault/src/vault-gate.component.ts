import { Component, inject, OnInit, signal } from "@angular/core";
import { AsyncPipe, NgComponentOutlet } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import type { VaultStatus } from "@termsh/common";
import { NavStateService, SettingsStateService, SyncStateService, VaultStateService } from "@termsh/state";
import { combineLatest, from, map, shareReplay } from "rxjs";
import { UnlockViewComponent } from "./unlock-view.component";
import {
  VaultOnboardingComponent,
  type VaultOnboardingContinue,
} from "./vault-onboarding.component";

type VaultGateView = {
  status: VaultStatus | null;
  loading: boolean;
  error: string | null;
  onboardingDismissed: boolean;
};

function canUseApp(
  status: { isSetup: boolean; isUnlocked: boolean } | null,
  skippedOnboarding: boolean,
): boolean {
  if (!status) return false;
  if (status.isUnlocked) return true;
  if (!status.isSetup && skippedOnboarding) return true;
  return false;
}

function showOnboarding(
  status: { isSetup: boolean } | null,
  dismissed: boolean,
  sessionDone: boolean,
): boolean {
  if (!status || status.isSetup) return false;
  return !dismissed && !sessionDone;
}

@Component({
  selector: "termsh-vault-gate",
  standalone: true,
  imports: [
    AsyncPipe,
    NgComponentOutlet,
    TranslateModule,
    UnlockViewComponent,
    VaultOnboardingComponent,
  ],
  template: `
    @if (vm$ | async; as vm) {
      @if (vm.error && !vm.status) {
        <div class="vault-screen">
          <div class="vault-card vault-screen__error">
            <h1>{{ 'vault.gate.initFailed' | translate }}</h1>
            <p class="vault-screen__muted">{{ vm.error }}</p>
            <button type="button" class="btn btn--primary" (click)="bootstrap()">
              {{ 'common.actions.retry' | translate }}
            </button>
          </div>
        </div>
      } @else if (vm.loading || !vm.status) {
        <div class="vault-screen">
          <p class="vault-screen__muted">{{ 'vault.gate.loading' | translate }}</p>
        </div>
      } @else if (vm.status.isSetup && !vm.status.isUnlocked) {
        <termsh-unlock-view />
      } @else if (showOnboard(vm.status, vm.onboardingDismissed, onboardingDone())) {
        <termsh-vault-onboarding (continue)="onOnboardingContinue($event)" />
      } @else if (canUse(vm.status, vm.onboardingDismissed || onboardingDone())) {
        @if (shell$ | async; as shell) {
          <ng-container *ngComponentOutlet="shell" />
        }
      } @else {
        <termsh-unlock-view />
      }
    }
  `,
})
export class VaultGateComponent implements OnInit {
  private readonly vault = inject(VaultStateService);
  private readonly settings = inject(SettingsStateService);
  private readonly nav = inject(NavStateService);
  private readonly sync = inject(SyncStateService);

  readonly onboardingDone = signal(false);
  readonly shell$ = from(import("@termsh/components").then((m) => m.AppShellComponent)).pipe(
    shareReplay(1),
  );
  readonly vm$ = combineLatest([
    this.vault.vaultStatus$,
    this.vault.loading$stream,
    this.vault.error$stream,
    this.settings.snapshotStream$,
  ]).pipe(
    map(([status, loading, error, snap]): VaultGateView => ({
      status,
      loading,
      error,
      onboardingDismissed: snap.vaultOnboardingDismissed,
    })),
  );

  ngOnInit() {
    void this.bootstrap();
  }

  bootstrap() {
    return this.vault.bootstrap();
  }

  canUse = canUseApp;
  showOnboard = showOnboarding;

  onOnboardingContinue(options?: VaultOnboardingContinue) {
    this.settings.dismissVaultOnboarding();
    this.onboardingDone.set(true);
    if (options?.openSyncSettings) {
      this.settings.setCloudSyncEnabled(true);
      this.sync.setEnabled(true);
      this.nav.setView("settings");
    }
  }
}
