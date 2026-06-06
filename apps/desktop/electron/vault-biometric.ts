import { systemPreferences } from "electron";

type BiometricKind = "none" | "touchId" | "faceId" | "windowsHello" | "generic";

const BIOMETRIC_SERVICE = "app.termsh.desktop.biometric";
const BIOMETRIC_ACCOUNT = "vault-master-key";

async function keytar() {
  return import("keytar");
}

export type BiometricStatus = {
  available: boolean;
  enabled: boolean;
  kind: BiometricKind;
};

function detectKind(): BiometricKind {
  if (process.platform !== "darwin") return "none";
  try {
    if (!systemPreferences.canPromptTouchID()) return "none";
    // Electron does not expose Touch ID vs Face ID; macOS prompt covers both.
    return "touchId";
  } catch {
    return "none";
  }
}

export async function biometricStatus(): Promise<BiometricStatus> {
  const kind = detectKind();
  const available = kind !== "none";
  const enabled = available && (await biometricIsEnabled());
  return { available, enabled, kind };
}

export async function biometricIsAvailable(): Promise<boolean> {
  return detectKind() !== "none";
}

export async function biometricIsEnabled(): Promise<boolean> {
  if (!(await biometricIsAvailable())) return false;
  try {
    const kt = await keytar();
    const value = await kt.getPassword(BIOMETRIC_SERVICE, BIOMETRIC_ACCOUNT);
    return Boolean(value);
  } catch {
    return false;
  }
}

export async function biometricStoreMasterKey(key: Buffer): Promise<void> {
  const kt = await keytar();
  await kt.setPassword(BIOMETRIC_SERVICE, BIOMETRIC_ACCOUNT, key.toString("base64"));
}

export async function biometricLoadMasterKey(): Promise<Buffer | null> {
  try {
    const kt = await keytar();
    const encoded = await kt.getPassword(BIOMETRIC_SERVICE, BIOMETRIC_ACCOUNT);
    if (!encoded) return null;
    const bytes = Buffer.from(encoded.trim(), "base64");
    if (bytes.length !== 32) return null;
    return bytes;
  } catch {
    return null;
  }
}

export async function biometricClearMasterKey(): Promise<void> {
  const kt = await keytar();
  await kt.deletePassword(BIOMETRIC_SERVICE, BIOMETRIC_ACCOUNT).catch(() => undefined);
}

export async function biometricPrompt(reason: string): Promise<boolean> {
  if (process.platform !== "darwin") return false;
  try {
    await systemPreferences.promptTouchID(reason);
    return true;
  } catch {
    return false;
  }
}
