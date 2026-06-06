const SERVICE = "app.termsh.desktop";
const LEGACY_SERVICE = "app.signum.desktop";
const ACCOUNT = "vault-master-key";

async function keytar() {
  return import("keytar");
}

export async function keychainIsAvailable(): Promise<boolean> {
  try {
    const kt = await keytar();
    return typeof kt.getPassword === "function";
  } catch {
    return false;
  }
}

async function readEncodedPassword(): Promise<string | null> {
  const kt = await keytar();
  const current = await kt.getPassword(SERVICE, ACCOUNT);
  if (current) return current;
  return kt.getPassword(LEGACY_SERVICE, ACCOUNT);
}

export async function keychainIsEnabled(): Promise<boolean> {
  if (!(await keychainIsAvailable())) return false;
  const value = await readEncodedPassword();
  return Boolean(value);
}

export async function keychainStoreMasterKey(key: Buffer): Promise<void> {
  const kt = await keytar();
  await kt.setPassword(SERVICE, ACCOUNT, key.toString("base64"));
}

export async function keychainLoadMasterKey(): Promise<Buffer | null> {
  const encoded = await readEncodedPassword();
  if (!encoded) return null;
  try {
    const bytes = Buffer.from(encoded.trim(), "base64");
    if (bytes.length !== 32) return null;
    return bytes;
  } catch {
    return null;
  }
}

export async function keychainClearMasterKey(): Promise<void> {
  const kt = await keytar();
  await kt.deletePassword(SERVICE, ACCOUNT).catch(() => undefined);
  await kt.deletePassword(LEGACY_SERVICE, ACCOUNT).catch(() => undefined);
}
