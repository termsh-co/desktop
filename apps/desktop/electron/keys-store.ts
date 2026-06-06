import { randomUUID } from "node:crypto";
import { generateSshKeyPair, type KeyAlgorithm } from "./keys-generate";
import {
  vaultDeleteSecret,
  vaultGetPayload,
  vaultIsUnlocked,
  vaultPutSecret,
  vaultReplacePayload,
} from "./vault-store";

export type KeyRecord = {
  id: string;
  name: string;
  refId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type SaveKeyInput = {
  id?: string;
  name: string;
  privateKey: string;
  tags: string[];
};

export type GenerateKeyInput = {
  name: string;
  algorithm: KeyAlgorithm;
  tags: string[];
};

export function keysList(): KeyRecord[] {
  if (!vaultIsUnlocked()) return [];
  return vaultGetPayload().keys.map((k) => ({ ...k }));
}

export function keysSave(input: SaveKeyInput): KeyRecord {
  const payload = vaultGetPayload();
  const now = new Date().toISOString();
  if (input.id) {
    const idx = payload.keys.findIndex((k) => k.id === input.id);
    if (idx === -1) throw new Error("Key not found");
    const existing = payload.keys[idx];
    if (input.privateKey.trim()) {
      vaultPutSecret(existing.refId, input.privateKey.trim());
    }
    const updated: KeyRecord = {
      ...existing,
      name: input.name,
      tags: input.tags ?? [],
      updatedAt: now,
    };
    payload.keys[idx] = updated;
    vaultReplacePayload(payload);
    return { ...updated };
  }
  const id = randomUUID();
  const refId = `sshkey:${id}`;
  vaultPutSecret(refId, input.privateKey.trim());
  const created: KeyRecord = {
    id,
    name: input.name,
    refId,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
  payload.keys.push(created);
  vaultReplacePayload(payload);
  return { ...created };
}

export function keysGenerate(input: GenerateKeyInput): {
  key: KeyRecord;
  publicKeyPem: string;
} {
  if (!input.name.trim()) throw new Error("Key name is required");
  const { privatePem, publicPem } = generateSshKeyPair(input.algorithm);
  const key = keysSave({
    name: input.name.trim(),
    privateKey: privatePem,
    tags: input.tags ?? [],
  });
  return { key, publicKeyPem: publicPem };
}

export function keysDelete(id: string): void {
  const payload = vaultGetPayload();
  const idx = payload.keys.findIndex((k) => k.id === id);
  if (idx === -1) throw new Error("Key not found");
  vaultDeleteSecret(payload.keys[idx].refId);
  payload.keys.splice(idx, 1);
  vaultReplacePayload(payload);
}
