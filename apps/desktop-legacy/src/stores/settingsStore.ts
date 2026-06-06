import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  isAppLocale,
  resolveDeviceLocale,
  resolveInitialLocale,
  type AppLocale,
} from "@/i18n/locale";
import {
  isSshIdleTimeout,
  type SshIdleTimeoutMinutes,
} from "@/lib/settings/sshIdle";
import {
  FONT_OPTIONS,
  type TerminalFontFamily,
} from "@/lib/settings/terminalFont";

type SettingsState = {
  locale: AppLocale;
  sshIdleTimeoutMinutes: SshIdleTimeoutMinutes;
  cloudSyncEnabled: boolean;
  vaultOnboardingDismissed: boolean;
  terminalFontFamily: TerminalFontFamily;
  terminalFontSize: number;
  setLocale: (locale: AppLocale) => void;
  setSshIdleTimeoutMinutes: (minutes: SshIdleTimeoutMinutes) => void;
  setCloudSyncEnabled: (enabled: boolean) => void;
  dismissVaultOnboarding: () => void;
  setTerminalFontFamily: (font: TerminalFontFamily) => void;
  setTerminalFontSize: (size: number) => void;
};

const DEFAULT_FONT_FAMILY: TerminalFontFamily = "JetBrains Mono";
const DEFAULT_FONT_SIZE = 13;

function isValidFontFamily(v: unknown): v is TerminalFontFamily {
  return typeof v === "string" && FONT_OPTIONS.some((f) => f.value === v);
}

function isValidFontSize(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 11 && v <= 18;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: resolveInitialLocale(),
      sshIdleTimeoutMinutes: 0,
      cloudSyncEnabled: false,
      vaultOnboardingDismissed: false,
      terminalFontFamily: DEFAULT_FONT_FAMILY,
      terminalFontSize: DEFAULT_FONT_SIZE,
      setLocale: (locale) => set({ locale }),
      setSshIdleTimeoutMinutes: (sshIdleTimeoutMinutes) => set({ sshIdleTimeoutMinutes }),
      setCloudSyncEnabled: (cloudSyncEnabled) => set({ cloudSyncEnabled }),
      dismissVaultOnboarding: () => set({ vaultOnboardingDismissed: true }),
      setTerminalFontFamily: (terminalFontFamily) => set({ terminalFontFamily }),
      setTerminalFontSize: (terminalFontSize) => set({ terminalFontSize }),
    }),
    {
      name: "termsh-settings",
      version: 5,
      migrate: (persisted, fromVersion) => {
        const state = persisted as Partial<SettingsState>;
        const raw = state.sshIdleTimeoutMinutes;
        const minutes =
          typeof raw === "number" && isSshIdleTimeout(raw) ? raw : 0;
        const locale =
          isAppLocale(state.locale)
            ? state.locale
            : fromVersion < 4
              ? resolveDeviceLocale()
              : resolveInitialLocale();
        return {
          ...state,
          locale,
          sshIdleTimeoutMinutes: minutes,
          cloudSyncEnabled: Boolean(state.cloudSyncEnabled),
          vaultOnboardingDismissed: Boolean(state.vaultOnboardingDismissed),
          terminalFontFamily: isValidFontFamily(state.terminalFontFamily)
            ? state.terminalFontFamily
            : DEFAULT_FONT_FAMILY,
          terminalFontSize: isValidFontSize(state.terminalFontSize)
            ? state.terminalFontSize
            : DEFAULT_FONT_SIZE,
        };
      },
    },
  ),
);

/** @internal */
export function resetSettingsStoreForTests() {
  useSettingsStore.setState({
    locale: "en",
    sshIdleTimeoutMinutes: 0,
    cloudSyncEnabled: false,
    vaultOnboardingDismissed: false,
    terminalFontFamily: DEFAULT_FONT_FAMILY,
    terminalFontSize: DEFAULT_FONT_SIZE,
  });
}
