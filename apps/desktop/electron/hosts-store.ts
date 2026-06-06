import type { HostRecord, SaveHostInput } from "./hosts-store-types";
import { randomUUID } from "node:crypto";
import {
  vaultDeleteSecret,
  vaultGetPayload,
  vaultGetSecret,
  vaultIsUnlocked,
  vaultPutSecret,
  vaultReplacePayload,
} from "./vault-store";

export type { HostRecord, SaveHostInput } from "./hosts-store-types";

function isHostOwnedSecretRef(ref: string, hostId: string): boolean {
  return ref === `cred:${hostId}` || ref === `key:${hostId}`;
}

function resolvePrivateKeyRef(
  payload: ReturnType<typeof vaultGetPayload>,
  input: SaveHostInput,
  hostId: string,
  existingRef?: string,
): string | undefined {
  if (input.sshKeyId?.trim()) {
    const key = payload.keys.find((k) => k.id === input.sshKeyId);
    if (!key) throw new Error("SSH key not found");
    return key.refId;
  }
  if (input.privateKey?.trim()) {
    const ref = existingRef ?? `key:${hostId}`;
    vaultPutSecret(ref, input.privateKey.trim());
    return ref;
  }
  return existingRef;
}

export function hostsList(): HostRecord[] {
  if (!vaultIsUnlocked()) return [];
  return vaultGetPayload().hosts.map((h) => ({ ...h }));
}

export function hostsSave(input: SaveHostInput): HostRecord {
  const payload = vaultGetPayload();

  if (input.id) {
    const idx = payload.hosts.findIndex((h) => h.id === input.id);
    if (idx === -1) throw new Error("Host not found");
    const existing = payload.hosts[idx];
    let credentialRef = existing.credentialRef;
    let privateKeyRef = existing.privateKeyRef;

    if (input.authType === "password") {
      privateKeyRef = undefined;
      if (input.password?.trim()) {
        credentialRef = credentialRef ?? `cred:${existing.id}`;
        vaultPutSecret(credentialRef, input.password.trim());
      }
    } else {
      credentialRef = undefined;
      privateKeyRef = resolvePrivateKeyRef(payload, input, existing.id, privateKeyRef);
    }

    const updated: HostRecord = {
      ...existing,
      name: input.name,
      hostname: input.hostname,
      port: input.port,
      username: input.username,
      authType: input.authType,
      tags: input.tags ?? [],
      group: input.group,
      color: input.color,
      platform: input.platform ?? existing.platform,
      credentialRef: input.authType === "password" ? credentialRef : undefined,
      privateKeyRef: input.authType === "privateKey" ? privateKeyRef : undefined,
    };
    payload.hosts[idx] = updated;
    vaultReplacePayload(payload);
    return { ...updated };
  }

  const id = randomUUID();
  let credentialRef: string | undefined;
  let privateKeyRef: string | undefined;

  if (input.authType === "password") {
    if (input.password?.trim()) {
      credentialRef = `cred:${id}`;
      vaultPutSecret(credentialRef, input.password.trim());
    }
  } else {
    privateKeyRef = resolvePrivateKeyRef(payload, input, id);
  }

  const created: HostRecord = {
    id,
    name: input.name,
    hostname: input.hostname,
    port: input.port,
    username: input.username,
    authType: input.authType,
    credentialRef: input.authType === "password" ? credentialRef : undefined,
    privateKeyRef: input.authType === "privateKey" ? privateKeyRef : undefined,
    tags: input.tags ?? [],
    group: input.group,
    color: input.color,
    platform: input.platform,
  };
  payload.hosts.push(created);
  vaultReplacePayload(payload);
  return { ...created };
}

export function hostsDelete(id: string): void {
  const payload = vaultGetPayload();
  const idx = payload.hosts.findIndex((h) => h.id === id);
  if (idx === -1) throw new Error("Host not found");
  const host = payload.hosts[idx];
  if (host.credentialRef && isHostOwnedSecretRef(host.credentialRef, id)) {
    vaultDeleteSecret(host.credentialRef);
  }
  if (host.privateKeyRef && isHostOwnedSecretRef(host.privateKeyRef, id)) {
    vaultDeleteSecret(host.privateKeyRef);
  }
  payload.hosts.splice(idx, 1);
  vaultReplacePayload(payload);
}

export function hostsSetPlatform(hostId: string, platform: string): HostRecord {
  const payload = vaultGetPayload();
  const idx = payload.hosts.findIndex((h) => h.id === hostId);
  if (idx === -1) throw new Error("Host not found");
  const updated: HostRecord = {
    ...payload.hosts[idx],
    platform,
    lastConnectedAt: new Date().toISOString(),
  };
  payload.hosts[idx] = updated;
  vaultReplacePayload(payload);
  return { ...updated };
}

export function hostsMarkConnected(hostId: string): HostRecord {
  const payload = vaultGetPayload();
  const idx = payload.hosts.findIndex((h) => h.id === hostId);
  if (idx === -1) throw new Error("Host not found");
  const updated: HostRecord = {
    ...payload.hosts[idx],
    lastConnectedAt: new Date().toISOString(),
  };
  payload.hosts[idx] = updated;
  vaultReplacePayload(payload);
  return { ...updated };
}

export function hostCredentials(hostId: string): {
  password?: string;
  privateKey?: string;
} {
  const host = vaultGetPayload().hosts.find((h) => h.id === hostId);
  if (!host) return {};
  return {
    password: host.credentialRef ? vaultGetSecret(host.credentialRef) : undefined,
    privateKey: host.privateKeyRef ? vaultGetSecret(host.privateKeyRef) : undefined,
  };
}
