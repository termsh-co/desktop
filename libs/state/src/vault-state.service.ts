import { Injectable, inject } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { BehaviorSubject } from "rxjs";
import { formatAppError, type VaultStatus } from "@termsh/common";
import type { VaultUnlockOptions } from "@termsh/platform";
import { TermshPlatformService } from "@termsh/platform";
import { HostStateService } from "./host-state.service";
import { KeyStateService } from "./key-state.service";
import { SettingsStateService } from "./settings-state.service";
import { SnippetStateService } from "./snippet-state.service";

@Injectable({ providedIn: "root" })
export class VaultStateService {
  private readonly platform = inject(TermshPlatformService);
  private readonly hosts = inject(HostStateService);
  private readonly snippets = inject(SnippetStateService);
  private readonly keys = inject(KeyStateService);
  private readonly settings = inject(SettingsStateService);
  private readonly translate = inject(TranslateService, { optional: true });
  private readonly status$ = new BehaviorSubject<VaultStatus | null>(null);
  private readonly loading$ = new BehaviorSubject(false);
  private readonly error$ = new BehaviorSubject<string | null>(null);
  private autoLockListenerBound = false;

  readonly vaultStatus$ = this.status$.asObservable();
  readonly loading$stream = this.loading$.asObservable();
  readonly error$stream = this.error$.asObservable();

  get status(): VaultStatus | null {
    return this.status$.value;
  }

  async bootstrap() {
    this.loading$.next(true);
    this.error$.next(null);
    try {
      const status = await this.tryAutoUnlock(await this.platform.vaultStatus);
      this.status$.next(status);
    } catch (e) {
      this.error$.next(this.formatError(e));
    } finally {
      this.loading$.next(false);
    }
  }

  private async tryAutoUnlock(status: VaultStatus): Promise<VaultStatus> {
    if (!status.isSetup || status.isUnlocked) return status;
    if (status.biometricEnabled) {
      const unlocked = await this.platform.vaultTryBiometricUnlock();
      if (unlocked) return this.platform.vaultStatus;
      return status;
    }
    if (status.keychainEnabled) {
      const unlocked = await this.platform.vaultTryKeychainUnlock();
      if (unlocked) return this.platform.vaultStatus;
    }
    return status;
  }

  async unlock(password: string, options: VaultUnlockOptions = {}) {
    this.error$.next(null);
    try {
      await this.platform.vaultUnlock(password, options);
      this.status$.next(await this.platform.vaultStatus);
      await this.syncAutoLockConfig();
    } catch (e) {
      const message = this.formatError(e);
      this.error$.next(message);
      throw e;
    }
  }

  async setup(password: string, options: VaultUnlockOptions = {}) {
    this.error$.next(null);
    try {
      await this.platform.vaultSetup(password, options);
      this.status$.next(await this.platform.vaultStatus);
      await this.syncAutoLockConfig();
    } catch (e) {
      const message = this.formatError(e);
      this.error$.next(message);
      throw e;
    }
  }

  async unlockWithBiometric(): Promise<boolean> {
    this.error$.next(null);
    try {
      const unlocked = await this.platform.vaultTryBiometricUnlock();
      if (unlocked) {
        this.status$.next(await this.platform.vaultStatus);
        await this.syncAutoLockConfig();
      }
      return unlocked;
    } catch (e) {
      this.error$.next(this.formatError(e));
      return false;
    }
  }

  async forgetKeychain() {
    this.error$.next(null);
    try {
      await this.platform.vaultForgetKeychain();
      this.status$.next(await this.platform.vaultStatus);
    } catch (e) {
      const message = this.formatError(e);
      this.error$.next(message);
      throw e;
    }
  }

  private formatError(err: unknown): string {
    const t = this.translate
      ? (key: string, params?: Record<string, unknown>) =>
          this.translate!.instant(key, params)
      : undefined;
    return formatAppError(err, t);
  }

  clearError() {
    this.error$.next(null);
  }

  private syncAutoLockConfig() {
    return this.platform.setAutoLockMinutes(this.settings.snapshot.vaultAutoLockMinutes);
  }

  async lock() {
    await this.platform.vaultLock();
    const current = this.status$.value;
    if (current) {
      this.status$.next({ ...current, isUnlocked: false });
    }
  }

  patch(partial: Partial<VaultStatus>) {
    const current = this.status$.value;
    if (current) this.status$.next({ ...current, ...partial });
  }

  bindAutoLockListener() {
    if (this.autoLockListenerBound) return;
    this.autoLockListenerBound = true;
    this.platform.onVaultLocked(() => this.handleAutoLocked());
  }

  private handleAutoLocked() {
    const current = this.status$.value;
    if (current) {
      this.status$.next({ ...current, isUnlocked: false });
    }
    this.hosts.clear();
    this.snippets.clear();
    this.keys.clear();
  }
}
