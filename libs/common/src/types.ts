import type { HostPlatform } from "./hostPlatform";

export type AuthType = "password" | "privateKey";

export type Host = {
  id: string;
  name: string;
  hostname: string;
  port: number;
  username: string;
  authType: AuthType;
  credentialRef?: string;
  privateKeyRef?: string;
  tags: string[];
  group?: string;
  color?: string;
  platform?: HostPlatform;
  lastConnectedAt?: string;
};

export type SessionKind = "local" | "ssh" | "remote";

/** SSH / uzak dosya oturumu: bağlanıyor → hazır veya hata */
export type SshPhase = "connecting" | "ready" | "failed";

export type RemotePhase = SshPhase;

export type Session = {
  id: string;
  kind: SessionKind;
  hostId?: string;
  title: string;
  cwd?: string;
  sshPhase?: SshPhase;
  sshError?: string;
  remoteProtocol?: RemoteProtocol;
  remotePhase?: RemotePhase;
  remoteError?: string;
  remotePath?: string;
};

export type RemoteProtocol = "sftp" | "ftp" | "ftps";

export type RemoteAuthType = AuthType;

export type RemoteServer = {
  id: string;
  name: string;
  protocol: RemoteProtocol;
  host: string;
  port: number;
  username: string;
  authType: RemoteAuthType;
  /**
   * Optional reference for password stored in vault / keychain.
   */
  credentialRef?: string;
  /**
   * Optional reference for a private key stored in vault.
   */
  privateKeyRef?: string;
  /**
   * Optional default remote path (e.g. /home/user).
   */
  defaultPath?: string;
  tags?: string[];
};

export type RemoteFileKind = "file" | "directory" | "symlink" | "other";

export type RemoteFileEntry = {
  /**
   * Basename of the entry.
   */
  name: string;
  /**
   * Full path on the remote server.
   */
  path: string;
  kind: RemoteFileKind;
  size: number | null;
  modifiedAt?: string;
};

export type BiometricKind = "none" | "touchId" | "faceId" | "windowsHello" | "generic";

export type VaultStatus = {
  isSetup: boolean;
  isUnlocked: boolean;
  /** OS anahtarlığı (Keychain / Credential Manager) kullanılabilir mi */
  keychainAvailable: boolean;
  /** Bu cihazda master key anahtarlıkta kayıtlı mı */
  keychainEnabled: boolean;
  /** Touch ID / Face ID / Windows Hello kullanılabilir mi */
  biometricAvailable: boolean;
  /** Biyometrik korumalı master key kayıtlı mı */
  biometricEnabled: boolean;
  biometricKind: BiometricKind;
};

export type AppInfo = {
  name: string;
  version: string;
};

export type Snippet = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type SshKey = {
  id: string;
  name: string;
  refId: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type SaveHostPayload = {
  id?: string;
  name: string;
  hostname: string;
  port: number;
  username: string;
  authType: AuthType;
  tags: string[];
  group?: string;
  color?: string;
  platform?: HostPlatform;
  sshKeyId?: string;
  password?: string;
  privateKey?: string;
};
