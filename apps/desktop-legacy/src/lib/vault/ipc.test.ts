import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { fetchVaultStatus, lockVault, setupVault, unlockVault } from "./ipc";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockedInvoke = vi.mocked(invoke);

describe("vault ipc", () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
  });

  it("fetchVaultStatus", async () => {
    mockedInvoke.mockResolvedValueOnce({
      isSetup: true,
      isUnlocked: false,
      keychainAvailable: true,
      keychainEnabled: false,
      biometricAvailable: true,
      biometricEnabled: false,
      biometricKind: "touchId",
    });
    const status = await fetchVaultStatus();
    expect(status.isSetup).toBe(true);
    expect(mockedInvoke).toHaveBeenCalledWith("vault_status");
  });

  it("setup and unlock forward unlock options", async () => {
    mockedInvoke.mockResolvedValue(undefined);
    await setupVault("secret-pass", { rememberInKeychain: true });
    expect(mockedInvoke).toHaveBeenCalledWith("vault_setup", {
      password: "secret-pass",
      rememberInKeychain: true,
      useBiometric: false,
    });
    await unlockVault("secret-pass", { useBiometric: true });
    expect(mockedInvoke).toHaveBeenCalledWith("vault_unlock", {
      password: "secret-pass",
      rememberInKeychain: false,
      useBiometric: true,
    });
    await lockVault();
    expect(mockedInvoke).toHaveBeenCalledWith("vault_lock");
  });
});
