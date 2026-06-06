import { beforeEach, describe, expect, it, vi } from "vitest";
import * as vaultIpc from "@/lib/vault/ipc";
import { resetHostStoreForTests } from "@/stores/hostStore";
import { resetVaultStoreForTests, useVaultStore } from "@/stores/vaultStore";

vi.mock("@/lib/env", () => ({
  isTauriRuntime: vi.fn(() => true),
}));

vi.mock("@/lib/vault/ipc", () => ({
  fetchVaultStatus: vi.fn(),
  setupVault: vi.fn(),
  unlockVault: vi.fn(),
  tryUnlockKeychain: vi.fn(),
  tryUnlockBiometric: vi.fn(),
  forgetKeychain: vi.fn(),
  lockVault: vi.fn(),
}));

const baseStatus = {
  isSetup: true,
  isUnlocked: false,
  keychainAvailable: true,
  keychainEnabled: false,
  biometricAvailable: true,
  biometricEnabled: false,
  biometricKind: "touchId" as const,
};

describe("vaultStore", () => {
  beforeEach(() => {
    resetVaultStoreForTests();
    resetHostStoreForTests();
    vi.clearAllMocks();
  });

  it("bootstrap loads vault status", async () => {
    vi.mocked(vaultIpc.fetchVaultStatus).mockResolvedValue(baseStatus);
    vi.mocked(vaultIpc.tryUnlockKeychain).mockResolvedValue(false);
    vi.mocked(vaultIpc.tryUnlockBiometric).mockResolvedValue(false);

    await useVaultStore.getState().bootstrap();

    expect(useVaultStore.getState().status?.isSetup).toBe(true);
    expect(useVaultStore.getState().loading).toBe(false);
  });

  it("bootstrap tries biometric unlock before keychain", async () => {
    vi.mocked(vaultIpc.fetchVaultStatus)
      .mockResolvedValueOnce({ ...baseStatus, biometricEnabled: true })
      .mockResolvedValueOnce({ ...baseStatus, biometricEnabled: true, isUnlocked: true });
    vi.mocked(vaultIpc.tryUnlockBiometric).mockResolvedValue(true);

    await useVaultStore.getState().bootstrap();

    expect(vaultIpc.tryUnlockBiometric).toHaveBeenCalled();
    expect(vaultIpc.tryUnlockKeychain).not.toHaveBeenCalled();
    expect(useVaultStore.getState().status?.isUnlocked).toBe(true);
  });

  it("lock clears host store", async () => {
    vi.mocked(vaultIpc.lockVault).mockResolvedValue(undefined);
    vi.mocked(vaultIpc.fetchVaultStatus).mockResolvedValue(baseStatus);
    vi.mocked(vaultIpc.tryUnlockKeychain).mockResolvedValue(false);
    vi.mocked(vaultIpc.tryUnlockBiometric).mockResolvedValue(false);

    const { useHostStore } = await import("@/stores/hostStore");
    useHostStore.setState({
      hosts: [
        {
          id: "1",
          name: "A",
          hostname: "a.com",
          port: 22,
          username: "u",
          authType: "password",
          tags: [],
        },
      ],
    });

    await useVaultStore.getState().lock();
    expect(useHostStore.getState().hosts).toHaveLength(0);
  });
});
