import { invoke } from "@tauri-apps/api/core";
import type { SshKey } from "@termsh/shared";

export type SaveKeyPayload = {
  id?: string;
  name: string;
  privateKeyPem?: string;
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

export async function listKeys(): Promise<SshKey[]> {
  return invoke<SshKey[]>("keys_list");
}

export async function saveKey(payload: SaveKeyPayload): Promise<SshKey> {
  return invoke<SshKey>("keys_save", { payload });
}

export async function generateKey(payload: GenerateKeyPayload): Promise<GenerateKeyResult> {
  return invoke<GenerateKeyResult>("keys_generate", { payload });
}

export async function deleteKey(id: string): Promise<void> {
  await invoke("keys_delete", { id });
}

