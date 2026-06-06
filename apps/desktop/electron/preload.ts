import { contextBridge, ipcRenderer } from "electron";

type VaultUnlockOptions = {
  rememberInKeychain?: boolean;
  useBiometric?: boolean;
};

type PtyDataPayload = { sessionId: string; data: string };
type PtyExitPayload = { sessionId: string };

contextBridge.exposeInMainWorld("termsh", {
  version: () => ipcRenderer.invoke("termsh:version") as Promise<string>,
  coreVersion: () => ipcRenderer.invoke("termsh:core-version") as Promise<string>,
  appInfo: () => ipcRenderer.invoke("termsh:app-info") as Promise<{ name: string; version: string }>,
  vaultStatus: () => ipcRenderer.invoke("termsh:vault-status") as Promise<unknown>,
  vaultSetup: (password: string, options?: VaultUnlockOptions) =>
    ipcRenderer.invoke("termsh:vault-setup", password, options) as Promise<void>,
  vaultUnlock: (password: string, options?: VaultUnlockOptions) =>
    ipcRenderer.invoke("termsh:vault-unlock", password, options) as Promise<void>,
  vaultLock: () => ipcRenderer.invoke("termsh:vault-lock") as Promise<void>,
  vaultTryKeychainUnlock: () =>
    ipcRenderer.invoke("termsh:vault-try-keychain-unlock") as Promise<boolean>,
  vaultTryBiometricUnlock: () =>
    ipcRenderer.invoke("termsh:vault-try-biometric-unlock") as Promise<boolean>,
  vaultForgetKeychain: () => ipcRenderer.invoke("termsh:vault-forget-keychain") as Promise<void>,
  keychainAvailable: () => ipcRenderer.invoke("termsh:keychain-available") as Promise<boolean>,
  ptyAvailable: () => ipcRenderer.invoke("termsh:pty-available") as Promise<boolean>,
  spawnLocalShell: (sessionId: string, cols: number, rows: number) =>
    ipcRenderer.invoke("termsh:pty-spawn-local", sessionId, cols, rows) as Promise<void>,
  spawnSshShell: (
    sessionId: string,
    hostId: string,
    cols: number,
    rows: number,
    password?: string,
  ) =>
    ipcRenderer.invoke("termsh:pty-spawn-ssh", sessionId, hostId, cols, rows, password) as Promise<void>,
  ptyWrite: (sessionId: string, data: string) => {
    ipcRenderer.send("termsh:pty-write", sessionId, data);
  },
  ptyResize: (sessionId: string, cols: number, rows: number) => {
    ipcRenderer.send("termsh:pty-resize", sessionId, cols, rows);
  },
  ptyClose: (sessionId: string) => ipcRenderer.invoke("termsh:pty-close", sessionId) as Promise<void>,
  onPtyData: (handler: (payload: PtyDataPayload) => void) => {
    const listener = (_event: unknown, payload: PtyDataPayload) => handler(payload);
    ipcRenderer.on("termsh:pty-data", listener);
    return () => ipcRenderer.removeListener("termsh:pty-data", listener);
  },
  onPtyExit: (handler: (payload: PtyExitPayload) => void) => {
    const listener = (_event: unknown, payload: PtyExitPayload) => handler(payload);
    ipcRenderer.on("termsh:pty-exit", listener);
    return () => ipcRenderer.removeListener("termsh:pty-exit", listener);
  },
  listHosts: () => ipcRenderer.invoke("termsh:hosts-list") as Promise<unknown>,
  saveHost: (payload: unknown) => ipcRenderer.invoke("termsh:hosts-save", payload) as Promise<unknown>,
  deleteHost: (id: string) => ipcRenderer.invoke("termsh:hosts-delete", id) as Promise<void>,
  detectHostPlatform: (hostId: string, passwordOverride?: string) =>
    ipcRenderer.invoke("termsh:hosts-detect-platform", hostId, passwordOverride) as Promise<unknown>,
  listSnippets: () => ipcRenderer.invoke("termsh:snippets-list") as Promise<unknown>,
  saveSnippet: (payload: unknown) => ipcRenderer.invoke("termsh:snippets-save", payload) as Promise<unknown>,
  deleteSnippet: (id: string) => ipcRenderer.invoke("termsh:snippets-delete", id) as Promise<void>,
  listKeys: () => ipcRenderer.invoke("termsh:keys-list") as Promise<unknown>,
  saveKey: (payload: unknown) => ipcRenderer.invoke("termsh:keys-save", payload) as Promise<unknown>,
  generateKey: (payload: unknown) =>
    ipcRenderer.invoke("termsh:keys-generate", payload) as Promise<unknown>,
  deleteKey: (id: string) => ipcRenderer.invoke("termsh:keys-delete", id) as Promise<void>,
  pingActivity: () => ipcRenderer.send("termsh:activity"),
  onVaultLocked: (handler: () => void) => {
    const listener = () => handler();
    ipcRenderer.on("termsh:vault-locked", listener);
    return () => ipcRenderer.removeListener("termsh:vault-locked", listener);
  },
  setAutoLockMinutes: (minutes: number) =>
    ipcRenderer.invoke("termsh:auto-lock-config", minutes) as Promise<void>,
  syncStatus: (config: { apiUrl: string; accessToken: string }) =>
    ipcRenderer.invoke("termsh:sync-status", config) as Promise<unknown>,
  syncPull: (config: { apiUrl: string; accessToken: string }) =>
    ipcRenderer.invoke("termsh:sync-pull", config) as Promise<unknown>,
  syncPush: (config: { apiUrl: string; accessToken: string }) =>
    ipcRenderer.invoke("termsh:sync-push", config) as Promise<unknown>,
  remoteListDir: (hostId: string, path: string, passwordOverride?: string) =>
    ipcRenderer.invoke("termsh:remote-list-dir", hostId, path, passwordOverride) as Promise<unknown>,
  localHomeDir: () => ipcRenderer.invoke("termsh:local-home-dir") as Promise<string>,
  localListDir: (path: string) =>
    ipcRenderer.invoke("termsh:local-list-dir", path) as Promise<unknown>,
  localCopyInto: (destDir: string, paths: string[]) =>
    ipcRenderer.invoke("termsh:local-copy-into", destDir, paths) as Promise<void>,
  remoteUpload: (
    hostId: string,
    localPath: string,
    remotePath: string,
    passwordOverride?: string,
  ) =>
    ipcRenderer.invoke(
      "termsh:remote-upload",
      hostId,
      localPath,
      remotePath,
      passwordOverride,
    ) as Promise<void>,
  remoteDownload: (
    hostId: string,
    remotePath: string,
    localPath: string,
    passwordOverride?: string,
  ) =>
    ipcRenderer.invoke(
      "termsh:remote-download",
      hostId,
      remotePath,
      localPath,
      passwordOverride,
    ) as Promise<void>,
  pickFiles: (multiple?: boolean) =>
    ipcRenderer.invoke("termsh:dialog-open-files", { multiple }) as Promise<string[]>,
  updaterCheck: () =>
    ipcRenderer.invoke("termsh:updater-check") as Promise<{
      available: boolean;
      version?: string;
      error?: string;
      dev?: boolean;
    }>,
  updaterInstall: () => ipcRenderer.invoke("termsh:updater-install") as Promise<void>,
  onUpdaterAvailable: (handler: (payload: { version: string }) => void) => {
    const listener = (_event: unknown, payload: { version: string }) => handler(payload);
    ipcRenderer.on("termsh:updater-available", listener);
    return () => ipcRenderer.removeListener("termsh:updater-available", listener);
  },
  onUpdaterNotAvailable: (handler: () => void) => {
    const listener = () => handler();
    ipcRenderer.on("termsh:updater-not-available", listener);
    return () => ipcRenderer.removeListener("termsh:updater-not-available", listener);
  },
  onUpdaterError: (handler: (payload: { message: string }) => void) => {
    const listener = (_event: unknown, payload: { message: string }) => handler(payload);
    ipcRenderer.on("termsh:updater-error", listener);
    return () => ipcRenderer.removeListener("termsh:updater-error", listener);
  },
});
