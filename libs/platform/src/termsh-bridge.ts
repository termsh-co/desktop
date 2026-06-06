import type { TermshDesktopApi } from "./api";

const MISSING = "termsh API unavailable (browser-only dev)";

function reject<T>(): Promise<T> {
  return Promise.reject(new Error(MISSING));
}

function noopUnsub(): void {
  /* browser stub */
}

/** Browser fallback when not running inside Electron. */
export function createBrowserStub(): TermshDesktopApi {
  return {
    version: () => Promise.resolve("0.0.0-dev"),
    coreVersion: () => Promise.resolve("napi-browser"),
    appInfo: () => Promise.resolve({ name: "termsh", version: "0.0.0-dev" }),
    vaultStatus: () =>
      Promise.resolve({
        isSetup: false,
        isUnlocked: false,
        keychainAvailable: false,
        keychainEnabled: false,
        biometricAvailable: false,
        biometricEnabled: false,
        biometricKind: "none",
      }),
    vaultSetup: () => reject(),
    vaultUnlock: () => reject(),
    vaultLock: () => Promise.resolve(),
    vaultTryKeychainUnlock: () => Promise.resolve(false),
    vaultTryBiometricUnlock: () => Promise.resolve(false),
    vaultForgetKeychain: () => Promise.resolve(),
    keychainAvailable: () => Promise.resolve(false),
    ptyAvailable: () => Promise.resolve(false),
    spawnLocalShell: () => reject(),
    spawnSshShell: () => reject(),
    ptyWrite: () => undefined,
    ptyResize: () => undefined,
    ptyClose: () => Promise.resolve(),
    onPtyData: () => noopUnsub,
    onPtyExit: () => noopUnsub,
    listHosts: () => Promise.resolve([]),
    saveHost: () => reject(),
    deleteHost: () => reject(),
    listSnippets: () => Promise.resolve([]),
    saveSnippet: () => reject(),
    deleteSnippet: () => reject(),
    listKeys: () => Promise.resolve([]),
    saveKey: () => reject(),
    generateKey: () => reject(),
    deleteKey: () => reject(),
    pingActivity: () => undefined,
    onVaultLocked: () => noopUnsub,
    setAutoLockMinutes: () => Promise.resolve(),
    syncStatus: () => Promise.resolve({ connected: false, email: null, lastSyncedAt: null, pendingChanges: 0 }),
    syncPull: () => Promise.resolve({ added: 0, updated: 0 }),
    syncPush: () => Promise.resolve({ added: 0, updated: 0 }),
    remoteListDir: () => Promise.resolve([]),
    localHomeDir: () => Promise.resolve(""),
    localListDir: () => Promise.resolve([]),
    localCopyInto: () => reject(),
    remoteUpload: () => reject(),
    remoteDownload: () => reject(),
    pickFiles: () => Promise.resolve([]),
    detectHostPlatform: () => reject(),
    updaterCheck: () => Promise.resolve({ available: false, dev: true }),
    updaterInstall: () => Promise.resolve(),
    onUpdaterAvailable: () => noopUnsub,
    onUpdaterNotAvailable: () => noopUnsub,
    onUpdaterError: () => noopUnsub,
  };
}

export function getTermshApi(): TermshDesktopApi {
  const api = window.termsh;
  if (!api?.version || !api?.vaultStatus) {
    return createBrowserStub();
  }
  return {
    version: () => api.version!(),
    coreVersion: () => api.coreVersion?.() ?? Promise.resolve("unknown"),
    appInfo: () => api.appInfo?.() ?? createBrowserStub().appInfo(),
    vaultStatus: () => api.vaultStatus!(),
    vaultSetup: (p, o) => api.vaultSetup!(p, o),
    vaultUnlock: (p, o) => api.vaultUnlock!(p, o),
    vaultLock: () => api.vaultLock?.() ?? Promise.resolve(),
    vaultTryKeychainUnlock: () => api.vaultTryKeychainUnlock?.() ?? Promise.resolve(false),
    vaultTryBiometricUnlock: () => api.vaultTryBiometricUnlock?.() ?? Promise.resolve(false),
    vaultForgetKeychain: () => api.vaultForgetKeychain?.() ?? Promise.resolve(),
    keychainAvailable: () => api.keychainAvailable?.() ?? Promise.resolve(false),
    ptyAvailable: () => api.ptyAvailable?.() ?? Promise.resolve(false),
    spawnLocalShell: (id, c, r) => api.spawnLocalShell!(id, c, r),
    spawnSshShell: (id, h, c, r, pwd) => api.spawnSshShell!(id, h, c, r, pwd),
    ptyWrite: (id, d) => api.ptyWrite?.(id, d),
    ptyResize: (id, c, r) => api.ptyResize?.(id, c, r),
    ptyClose: (id) => api.ptyClose?.(id) ?? Promise.resolve(),
    onPtyData: (h) => api.onPtyData?.(h) ?? noopUnsub,
    onPtyExit: (h) => api.onPtyExit?.(h) ?? noopUnsub,
    listHosts: () => api.listHosts?.() ?? Promise.resolve([]),
    saveHost: (p) => api.saveHost!(p),
    deleteHost: (id) => api.deleteHost!(id),
    listSnippets: () => api.listSnippets?.() ?? Promise.resolve([]),
    saveSnippet: (p) => api.saveSnippet!(p),
    deleteSnippet: (id) => api.deleteSnippet!(id),
    listKeys: () => api.listKeys?.() ?? Promise.resolve([]),
    saveKey: (p) => api.saveKey!(p),
    generateKey: (p) => api.generateKey!(p),
    deleteKey: (id) => api.deleteKey!(id),
    pingActivity: () => api.pingActivity?.(),
    onVaultLocked: (h) => api.onVaultLocked?.(h) ?? noopUnsub,
    setAutoLockMinutes: (m) => api.setAutoLockMinutes?.(m) ?? Promise.resolve(),
    syncStatus: (c) => api.syncStatus!(c),
    syncPull: (c) => api.syncPull!(c),
    syncPush: (c) => api.syncPush!(c),
    remoteListDir: (hostId, path, pwd) =>
      api.remoteListDir?.(hostId, path, pwd) ?? Promise.resolve([]),
    localHomeDir: () => api.localHomeDir?.() ?? Promise.resolve(""),
    localListDir: (path) => api.localListDir?.(path) ?? Promise.resolve([]),
    localCopyInto: (destDir, paths) => api.localCopyInto?.(destDir, paths) ?? reject(),
    remoteUpload: (hostId, local, remote, pwd) =>
      api.remoteUpload?.(hostId, local, remote, pwd) ?? reject(),
    remoteDownload: (hostId, remote, local, pwd) =>
      api.remoteDownload?.(hostId, remote, local, pwd) ?? reject(),
    pickFiles: (multiple) => api.pickFiles?.(multiple) ?? Promise.resolve([]),
    detectHostPlatform: (hostId, pwd) =>
      api.detectHostPlatform?.(hostId, pwd) ?? reject(),
    updaterCheck: () => api.updaterCheck?.() ?? Promise.resolve({ available: false, dev: true }),
    updaterInstall: () => api.updaterInstall?.() ?? Promise.resolve(),
    onUpdaterAvailable: (h) => api.onUpdaterAvailable?.(h) ?? noopUnsub,
    onUpdaterNotAvailable: (h) => api.onUpdaterNotAvailable?.(h) ?? noopUnsub,
    onUpdaterError: (h) => api.onUpdaterError?.(h) ?? noopUnsub,
  };
}
