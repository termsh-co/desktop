import { Injectable } from "@angular/core";
import type { SshIdleTimeoutMinutes, ThemeId } from "@termsh/common";
import { isSshIdleTimeout, normalizeThemeId } from "@termsh/common";
import { BehaviorSubject } from "rxjs";

export type AppLocale = "en" | "tr" | "de" | "es" | "zh";
export type { ThemeId } from "@termsh/common";

const STORAGE_KEY = "termsh-settings-v1";

type SettingsSnapshot = {
  locale: AppLocale;
  themeId: ThemeId;
  terminalFontSize: number;
  cloudSyncEnabled: boolean;
  /** 0 = never auto-lock vault */
  vaultAutoLockMinutes: number;
  /** 0 = never auto-close idle SSH */
  sshIdleTimeoutMinutes: SshIdleTimeoutMinutes;
  vaultOnboardingDismissed: boolean;
};

const DEFAULT_SNAPSHOT: SettingsSnapshot = {
  locale: "en",
  themeId: "rego",
  terminalFontSize: 13,
  cloudSyncEnabled: false,
  vaultAutoLockMinutes: 15,
  sshIdleTimeoutMinutes: 0,
  vaultOnboardingDismissed: false,
};

function loadSnapshot(): SettingsSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as Partial<SettingsSnapshot>;
    return {
      ...DEFAULT_SNAPSHOT,
      ...parsed,
      themeId: normalizeThemeId(parsed.themeId ?? DEFAULT_SNAPSHOT.themeId),
    };
  } catch {
    return { ...DEFAULT_SNAPSHOT };
  }
}

@Injectable({ providedIn: "root" })
export class SettingsStateService {
  private readonly snapshot$ = new BehaviorSubject<SettingsSnapshot>(loadSnapshot());

  readonly snapshotStream$ = this.snapshot$.asObservable();

  get snapshot(): SettingsSnapshot {
    return this.snapshot$.value;
  }

  private persist(next: SettingsSnapshot) {
    this.snapshot$.next(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    document.documentElement.dataset.theme = next.themeId;
  }

  setLocale(locale: AppLocale) {
    this.persist({ ...this.snapshot, locale });
  }

  setThemeId(themeId: ThemeId) {
    this.persist({ ...this.snapshot, themeId });
  }

  setTerminalFontSize(terminalFontSize: number) {
    this.persist({ ...this.snapshot, terminalFontSize });
  }

  setCloudSyncEnabled(cloudSyncEnabled: boolean) {
    this.persist({ ...this.snapshot, cloudSyncEnabled });
  }

  setVaultAutoLockMinutes(vaultAutoLockMinutes: number) {
    this.persist({ ...this.snapshot, vaultAutoLockMinutes });
  }

  setSshIdleTimeoutMinutes(sshIdleTimeoutMinutes: SshIdleTimeoutMinutes) {
    const minutes = isSshIdleTimeout(sshIdleTimeoutMinutes) ? sshIdleTimeoutMinutes : 0;
    this.persist({ ...this.snapshot, sshIdleTimeoutMinutes: minutes });
  }

  dismissVaultOnboarding() {
    this.persist({ ...this.snapshot, vaultOnboardingDismissed: true });
  }
}
