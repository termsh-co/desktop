import { existsSync, unlinkSync } from "node:fs";
import { createDecipheriv, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { dataPath, readJson, writeJson } from "./data-store";
import type { HostRecord } from "./hosts-store";
import type { KeyRecord } from "./keys-store";
import type { SnippetRecord } from "./snippets-store";
import {
  checkVerifier,
  decryptBlob,
  deriveMasterKey,
  encryptBlob,
  makeVerifier,
} from "./vault-crypto";
import {
  biometricClearMasterKey,
  biometricIsAvailable,
  biometricIsEnabled,
  biometricLoadMasterKey,
  biometricPrompt,
  biometricStatus,
  biometricStoreMasterKey,
} from "./vault-biometric";
import {
  keychainClearMasterKey,
  keychainIsAvailable,
  keychainIsEnabled,
  keychainLoadMasterKey,
  keychainStoreMasterKey,
} from "./vault-keychain";

export type VaultUnlockOptions = {
  rememberInKeychain?: boolean;
  useBiometric?: boolean;
};

export type VaultPayload = {
  version: 1;
  hosts: HostRecord[];
  snippets: SnippetRecord[];
  keys: KeyRecord[];
  secrets: Record<string, string>;
};

type VaultMeta = {
  salt: string;
  verifier?: string;
  hash?: string;
  kdf?: "argon2id" | "scrypt-legacy";
};

type VaultStatus = {
  isSetup: boolean;
  isUnlocked: boolean;
  keychainAvailable: boolean;
  keychainEnabled: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  biometricKind: "none" | "touchId" | "faceId" | "windowsHello" | "generic";
};

const EMPTY_PAYLOAD = (): VaultPayload => ({
  version: 1,
  hosts: [],
  snippets: [],
  keys: [],
  secrets: {},
});

const meta: { current: VaultMeta | null } = { current: null };
let runtimeKey: Buffer | null = null;
let runtimeUnlocked = false;
let payloadCache: VaultPayload | null = null;

const LEGACY_FILES = [
  "hosts.json",
  "snippets.json",
  "keys.json",
  "vault-secrets.enc.json",
] as const;

function loadMeta(): VaultMeta | null {
  if (meta.current) return meta.current;
  meta.current = readJson<VaultMeta | null>("vault-meta.json", null);
  return meta.current;
}

function persistMeta(record: VaultMeta) {
  meta.current = record;
  writeJson("vault-meta.json", record);
}

function persistPayload(key: Buffer, data: VaultPayload) {
  const plain = Buffer.from(JSON.stringify(data), "utf8");
  const blob = encryptBlob(key, plain);
  writeJson("vault-data.enc.json", { blob: blob.toString("base64") });
}

function loadEncryptedPayload(key: Buffer): VaultPayload {
  const file = readJson<{ blob?: string }>("vault-data.enc.json", {});
  if (!file.blob) return EMPTY_PAYLOAD();
  const blob = Buffer.from(file.blob, "base64");
  const plain = decryptBlob(key, blob);
  return JSON.parse(plain.toString("utf8")) as VaultPayload;
}

/** Import plaintext legacy JSON files into encrypted vault (one-time). */
function migrateLegacyPlaintext(key: Buffer): VaultPayload | null {
  const hosts = readJson<HostRecord[]>("hosts.json", []);
  const snippets = readJson<SnippetRecord[]>("snippets.json", []);
  const keys = readJson<KeyRecord[]>("keys.json", []);
  const secretsFile = readJson<{ blob?: string }>("vault-secrets.enc.json", {});

  if (hosts.length === 0 && snippets.length === 0 && keys.length === 0 && !secretsFile.blob) {
    return null;
  }

  let secrets: Record<string, string> = {};
  if (secretsFile.blob) {
    try {
      const buf = Buffer.from(secretsFile.blob, "base64");
      const iv = buf.subarray(0, 12);
      const tag = buf.subarray(12, 28);
      const enc = buf.subarray(28);
      const decipher = createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(tag);
      const plain = Buffer.concat([decipher.update(enc), decipher.final()]);
      secrets = JSON.parse(plain.toString("utf8")) as Record<string, string>;
    } catch {
      secrets = {};
    }
  }

  return { version: 1, hosts, snippets, keys, secrets };
}

function removeLegacyFiles() {
  for (const f of LEGACY_FILES) {
    try {
      const p = dataPath(f);
      if (existsSync(p)) unlinkSync(p);
    } catch {
      /* ignore */
    }
  }
}

function requireUnlocked(): VaultPayload {
  if (!runtimeUnlocked || !runtimeKey || !payloadCache) {
    throw new Error("Vault is locked");
  }
  return payloadCache;
}

function touchPayload(mutator: (p: VaultPayload) => void) {
  const p = requireUnlocked();
  mutator(p);
  persistPayload(runtimeKey!, p);
}

export async function vaultStatus(): Promise<VaultStatus> {
  const m = loadMeta();
  const keychainAvailable = await keychainIsAvailable();
  const keychainEnabled = keychainAvailable && (await keychainIsEnabled());
  const bio = await biometricStatus();
  return {
    isSetup: Boolean(m),
    isUnlocked: runtimeUnlocked,
    keychainAvailable,
    keychainEnabled,
    biometricAvailable: bio.available,
    biometricEnabled: bio.enabled,
    biometricKind: bio.kind,
  };
}

async function syncUnlockStorage(
  key: Buffer,
  rememberInKeychain: boolean,
  useBiometric: boolean,
): Promise<void> {
  if (useBiometric && (await biometricIsAvailable())) {
    await keychainClearMasterKey();
    await biometricStoreMasterKey(key);
    return;
  }

  await biometricClearMasterKey();
  if (rememberInKeychain && (await keychainIsAvailable())) {
    await keychainStoreMasterKey(key);
  } else {
    await keychainClearMasterKey();
  }
}

function finishUnlock(key: Buffer) {
  runtimeKey = key;
  runtimeUnlocked = true;

  if (existsSync(dataPath("vault-data.enc.json"))) {
    payloadCache = loadEncryptedPayload(key);
  } else {
    payloadCache = migrateLegacyPlaintext(key) ?? EMPTY_PAYLOAD();
    persistPayload(key, payloadCache);
    removeLegacyFiles();
  }
}

export function vaultUnlockWithMasterKey(key: Buffer) {
  const m = loadMeta();
  if (!m) throw new Error("Vault is not set up");

  if (m.verifier && m.kdf === "argon2id") {
    const verifier = Buffer.from(m.verifier, "base64");
    if (!checkVerifier(key, verifier)) {
      throw new Error("Invalid stored key");
    }
  } else if (m.hash) {
    const expected = Buffer.from(m.hash, "base64");
    if (expected.length !== key.length || !timingSafeEqual(expected, key)) {
      throw new Error("Invalid stored key");
    }
  } else {
    throw new Error("Invalid vault metadata");
  }

  finishUnlock(key);
}

export async function vaultTryKeychainUnlock(): Promise<boolean> {
  if (!loadMeta() || runtimeUnlocked) return false;
  const key = await keychainLoadMasterKey();
  if (!key) return false;
  try {
    vaultUnlockWithMasterKey(key);
    return true;
  } catch {
    await vaultForgetKeychain();
    return false;
  }
}

export async function vaultTryBiometricUnlock(): Promise<boolean> {
  if (!loadMeta() || runtimeUnlocked) return false;
  if (!(await biometricIsEnabled())) return false;
  if (!(await biometricPrompt("Unlock termsh vault"))) return false;
  const key = await biometricLoadMasterKey();
  if (!key) return false;
  try {
    vaultUnlockWithMasterKey(key);
    return true;
  } catch {
    await biometricClearMasterKey();
    return false;
  }
}

export async function vaultForgetKeychain(): Promise<void> {
  await keychainClearMasterKey();
  await biometricClearMasterKey();
}

export async function vaultSetup(password: string, options: VaultUnlockOptions = {}) {
  if (password.length < 8) throw new Error("Master password must be at least 8 characters");
  const salt = randomBytes(16);
  const key = deriveMasterKey(password, salt);
  const verifier = makeVerifier(key);
  persistMeta({
    salt: salt.toString("base64"),
    verifier: verifier.toString("base64"),
    kdf: "argon2id",
  });
  runtimeKey = key;
  runtimeUnlocked = true;
  payloadCache = EMPTY_PAYLOAD();
  persistPayload(key, payloadCache);
  await syncUnlockStorage(
    key,
    options.rememberInKeychain ?? false,
    options.useBiometric ?? false,
  );
}

export async function vaultUnlock(password: string, options: VaultUnlockOptions = {}) {
  const m = loadMeta();
  if (!m) throw new Error("Vault is not set up");
  const salt = Buffer.from(m.salt, "base64");

  let key: Buffer;
  if (m.verifier && m.kdf === "argon2id") {
    key = deriveMasterKey(password, salt);
    const verifier = Buffer.from(m.verifier, "base64");
    if (!checkVerifier(key, verifier)) {
      throw new Error("Invalid master password");
    }
  } else if (m.hash) {
    key = scryptSync(password, salt, 32);
    const expected = Buffer.from(m.hash, "base64");
    if (expected.length !== key.length || !timingSafeEqual(expected, key)) {
      throw new Error("Invalid master password");
    }
    void upgradeLegacyMeta(password, salt, key);
  } else {
    throw new Error("Invalid vault metadata");
  }

  finishUnlock(key);
  await syncUnlockStorage(
    key,
    options.rememberInKeychain ?? false,
    options.useBiometric ?? false,
  );
}

function upgradeLegacyMeta(password: string, salt: Buffer, key: Buffer) {
  const verifier = makeVerifier(key);
  persistMeta({
    salt: salt.toString("base64"),
    verifier: verifier.toString("base64"),
    kdf: "argon2id",
  });
}

export function vaultLock() {
  runtimeUnlocked = false;
  runtimeKey = null;
  payloadCache = null;
}

export function vaultIsUnlocked(): boolean {
  return runtimeUnlocked;
}

export function vaultGetPayload(): VaultPayload {
  const p = requireUnlocked();
  return structuredClone(p);
}

export function vaultReplacePayload(next: VaultPayload) {
  touchPayload((p) => {
    p.hosts = next.hosts;
    p.snippets = next.snippets;
    p.keys = next.keys;
    p.secrets = next.secrets;
  });
}

export function vaultPutSecret(refId: string, value: string) {
  touchPayload((p) => {
    p.secrets[refId] = value;
  });
}

export function vaultGetSecret(refId: string): string | undefined {
  return requireUnlocked().secrets[refId];
}

export function vaultDeleteSecret(refId: string) {
  touchPayload((p) => {
    delete p.secrets[refId];
  });
}

export function vaultRequireMasterKey(): Buffer {
  if (!runtimeUnlocked || !runtimeKey) throw new Error("Vault is locked");
  return runtimeKey;
}

export function vaultPersistPayload(): void {
  if (!runtimeUnlocked || !runtimeKey || !payloadCache) {
    throw new Error("Vault is locked");
  }
  persistPayload(runtimeKey, payloadCache);
}
