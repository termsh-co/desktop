import { create } from "zustand";
import type { VaultStatus } from "@termsh/shared";
import {
  fetchVaultStatus,
  forgetKeychain as forgetKeychainVault,
  lockVault,
  setupVault,
  tryUnlockBiometric,
  tryUnlockKeychain,
  unlockVault,
  type VaultUnlockOptions,
} from "@/lib/vault/ipc";
import { i18n } from "@/i18n";
import { formatAppError } from "@/lib/errors/appError";
import { isTauriRuntime } from "@/lib/env";
import { useHostStore } from "@/stores/hostStore";

type VaultState = {
  status: VaultStatus | null;
  loading: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  setup: (password: string, options?: VaultUnlockOptions) => Promise<void>;
  unlock: (password: string, options?: VaultUnlockOptions) => Promise<void>;
  unlockWithBiometric: () => Promise<boolean>;
  forgetKeychain: () => Promise<void>;
  lock: () => Promise<void>;
  clearError: () => void;
};

async function tryAutoUnlock(status: VaultStatus): Promise<VaultStatus> {
  if (!status.isSetup || status.isUnlocked) {
    return status;
  }
  if (status.biometricEnabled) {
    const unlocked = await tryUnlockBiometric();
    if (unlocked) {
      return fetchVaultStatus();
    }
    return status;
  }
  if (status.keychainEnabled) {
    const unlocked = await tryUnlockKeychain();
    if (unlocked) {
      return fetchVaultStatus();
    }
  }
  return status;
}

export const useVaultStore = create<VaultState>((set) => ({
  status: null,
  loading: true,
  error: null,

  bootstrap: async () => {
    set({ loading: true, error: null });
    if (!isTauriRuntime()) {
      set({
        loading: false,
        error: i18n.t("common:runtime.notTauri"),
      });
      return;
    }
    try {
      const status = await tryAutoUnlock(await fetchVaultStatus());
      set({ status, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: formatAppError(err),
      });
    }
  },

  setup: async (password, options = {}) => {
    set({ error: null });
    try {
      await setupVault(password, options);
      set({ status: await fetchVaultStatus() });
    } catch (err) {
      set({ error: formatAppError(err) });
      throw err;
    }
  },

  unlock: async (password, options = {}) => {
    set({ error: null });
    try {
      await unlockVault(password, options);
      set({ status: await fetchVaultStatus() });
    } catch (err) {
      set({ error: formatAppError(err) });
      throw err;
    }
  },

  unlockWithBiometric: async () => {
    set({ error: null });
    try {
      const unlocked = await tryUnlockBiometric();
      if (unlocked) {
        set({ status: await fetchVaultStatus() });
      }
      return unlocked;
    } catch (err) {
      set({ error: formatAppError(err) });
      return false;
    }
  },

  forgetKeychain: async () => {
    set({ error: null });
    try {
      await forgetKeychainVault();
      set({ status: await fetchVaultStatus() });
    } catch (err) {
      set({ error: formatAppError(err) });
      throw err;
    }
  },

  lock: async () => {
    await lockVault();
    set({ status: await fetchVaultStatus() });
    useHostStore.getState().clear();
  },

  clearError: () => set({ error: null }),
}));

/** @internal */
export function resetVaultStoreForTests() {
  useVaultStore.setState({ status: null, loading: false, error: null });
}
