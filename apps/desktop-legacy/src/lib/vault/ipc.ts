import { invoke } from "@tauri-apps/api/core";
import type { VaultStatus } from "@termsh/shared";

export async function fetchVaultStatus(): Promise<VaultStatus> {
  return invoke<VaultStatus>("vault_status");
}

export type VaultUnlockOptions = {
  rememberInKeychain?: boolean;
  useBiometric?: boolean;
};

export async function setupVault(
  password: string,
  options: VaultUnlockOptions = {},
): Promise<void> {
  await invoke("vault_setup", {
    password,
    rememberInKeychain: options.rememberInKeychain ?? false,
    useBiometric: options.useBiometric ?? false,
  });
}

export async function unlockVault(
  password: string,
  options: VaultUnlockOptions = {},
): Promise<void> {
  await invoke("vault_unlock", {
    password,
    rememberInKeychain: options.rememberInKeychain ?? false,
    useBiometric: options.useBiometric ?? false,
  });
}

export async function tryUnlockKeychain(): Promise<boolean> {
  return invoke<boolean>("vault_try_keychain_unlock");
}

export async function tryUnlockBiometric(): Promise<boolean> {
  return invoke<boolean>("vault_try_biometric_unlock");
}

export async function forgetKeychain(): Promise<void> {
  await invoke("vault_forget_keychain");
}

export async function lockVault(): Promise<void> {
  await invoke("vault_lock");
}
