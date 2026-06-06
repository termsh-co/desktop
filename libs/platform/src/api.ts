import type {
  AppInfo,
  Host,
  RemoteFileEntry,
  SaveHostPayload,
  Snippet,
  SshKey,
  VaultStatus,
} from "@termsh/common";

export type VaultUnlockOptions = {
  rememberInKeychain?: boolean;
  useBiometric?: boolean;
};

export type PtyDataPayload = { sessionId: string; data: string };
export type PtyExitPayload = { sessionId: string };

export type SyncConfig = {
  apiUrl: string;
  accessToken: string;
};

export type SyncStatus = {
  connected: boolean;
  email: string | null;
  lastSyncedAt: string | null;
  pendingChanges: number;
};

export type SyncEvent = {
  added: number;
  updated: number;
};

export type SaveSnippetPayload = {
  id?: string;
  title: string;
  body: string;
  tags: string[];
};

export type SaveKeyPayload = {
  id?: string;
  name: string;
  privateKey: string;
  tags: string[];
};

export type GenerateKeyPayload = {
  name: string;
  algorithm: "ed25519" | "rsa";
  tags: string[];
};

export type GenerateKeyResult = {
  key: SshKey;
  publicKeyPem: string;
};

export type UpdateCheckResult = {
  available: boolean;
  version?: string;
  error?: string;
  dev?: boolean;
};

/** Electron preload / Tauri invoke parity surface. */
export interface TermshDesktopApi {
  version(): Promise<string>;
  coreVersion(): Promise<string>;
  appInfo(): Promise<AppInfo>;
  vaultStatus(): Promise<VaultStatus>;
  vaultSetup(password: string, options?: VaultUnlockOptions): Promise<void>;
  vaultUnlock(password: string, options?: VaultUnlockOptions): Promise<void>;
  vaultLock(): Promise<void>;
  vaultTryKeychainUnlock(): Promise<boolean>;
  vaultTryBiometricUnlock(): Promise<boolean>;
  vaultForgetKeychain(): Promise<void>;
  keychainAvailable(): Promise<boolean>;
  ptyAvailable(): Promise<boolean>;
  spawnLocalShell(sessionId: string, cols: number, rows: number): Promise<void>;
  spawnSshShell(
    sessionId: string,
    hostId: string,
    cols: number,
    rows: number,
    password?: string,
  ): Promise<void>;
  ptyWrite(sessionId: string, data: string): void;
  ptyResize(sessionId: string, cols: number, rows: number): void;
  ptyClose(sessionId: string): Promise<void>;
  onPtyData(handler: (payload: PtyDataPayload) => void): () => void;
  onPtyExit(handler: (payload: PtyExitPayload) => void): () => void;
  listHosts(): Promise<Host[]>;
  saveHost(payload: SaveHostPayload): Promise<Host>;
  deleteHost(id: string): Promise<void>;
  listSnippets(): Promise<Snippet[]>;
  saveSnippet(payload: SaveSnippetPayload): Promise<Snippet>;
  deleteSnippet(id: string): Promise<void>;
  listKeys(): Promise<SshKey[]>;
  saveKey(payload: SaveKeyPayload): Promise<SshKey>;
  generateKey(payload: GenerateKeyPayload): Promise<GenerateKeyResult>;
  deleteKey(id: string): Promise<void>;
  pingActivity(): void;
  onVaultLocked(handler: () => void): () => void;
  setAutoLockMinutes(minutes: number): Promise<void>;
  syncStatus(config: SyncConfig): Promise<SyncStatus>;
  syncPull(config: SyncConfig): Promise<SyncEvent>;
  syncPush(config: SyncConfig): Promise<SyncEvent>;
  remoteListDir(hostId: string, path: string, passwordOverride?: string): Promise<RemoteFileEntry[]>;
  localHomeDir(): Promise<string>;
  localListDir(path: string): Promise<RemoteFileEntry[]>;
  localCopyInto(destDir: string, paths: string[]): Promise<void>;
  remoteUpload(
    hostId: string,
    localPath: string,
    remotePath: string,
    passwordOverride?: string,
  ): Promise<void>;
  remoteDownload(
    hostId: string,
    remotePath: string,
    localPath: string,
    passwordOverride?: string,
  ): Promise<void>;
  pickFiles(multiple?: boolean): Promise<string[]>;
  detectHostPlatform(hostId: string, passwordOverride?: string): Promise<Host>;
  updaterCheck(): Promise<UpdateCheckResult>;
  updaterInstall(): Promise<void>;
  onUpdaterAvailable(handler: (payload: { version: string }) => void): () => void;
  onUpdaterNotAvailable(handler: () => void): () => void;
  onUpdaterError(handler: (payload: { message: string }) => void): () => void;
}

declare global {
  interface Window {
    termsh?: Partial<TermshDesktopApi>;
  }
}
