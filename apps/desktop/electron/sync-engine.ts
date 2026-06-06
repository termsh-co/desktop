import type { HostRecord } from "./hosts-store-types";
import type { KeyRecord } from "./keys-store";
import type { SnippetRecord } from "./snippets-store";
import {
  getItemVersion,
  getLastSyncedAt,
  setItemVersion,
  setLastSyncedAt,
} from "./sync-meta";
import { syncPullBlobs, syncPushBlob, syncWhoami, type SyncServerConfig } from "./sync-client";
import { decryptSyncPayload, encryptSyncPayload, type SyncPayload } from "./sync-crypto";
import {
  vaultGetPayload,
  vaultIsUnlocked,
  vaultPersistPayload,
  vaultRequireMasterKey,
} from "./vault-store";

export type SyncStatusResult = {
  connected: boolean;
  email: string | null;
  lastSyncedAt: string | null;
  pendingChanges: number;
};

export type SyncEventResult = {
  added: number;
  updated: number;
};

export async function syncStatus(config: SyncServerConfig): Promise<SyncStatusResult> {
  try {
    const user = await syncWhoami(config);
    return {
      connected: true,
      email: user.email,
      lastSyncedAt: getLastSyncedAt() ?? null,
      pendingChanges: 0,
    };
  } catch {
    return {
      connected: false,
      email: null,
      lastSyncedAt: getLastSyncedAt() ?? null,
      pendingChanges: 0,
    };
  }
}

export async function syncPull(config: SyncServerConfig): Promise<SyncEventResult> {
  if (!vaultIsUnlocked()) throw new Error("Vault is locked");

  const key = vaultRequireMasterKey();
  const since = getLastSyncedAt();
  const blobs = await syncPullBlobs(config, since);

  let added = 0;
  let updated = 0;
  const payload = vaultGetPayload();

  for (const blob of blobs) {
    const item = decryptSyncPayload(key, blob);
    const current = getItemVersion(item.item_type, item.item_ref);
    if (current >= item.version) continue;

    switch (item.item_type) {
      case "host":
        applyHost(payload, JSON.parse(item.data) as HostRecord);
        break;
      case "snippet":
        applySnippet(payload, JSON.parse(item.data) as SnippetRecord);
        break;
      case "ssh_key":
        applyKey(payload, JSON.parse(item.data) as KeyRecord);
        break;
      default:
        continue;
    }

    setItemVersion(item.item_type, item.item_ref, item.version);
    if (current === 0) added += 1;
    else updated += 1;
  }

  vaultPersistPayload();

  if (blobs.length > 0) {
    const latest = blobs
      .map((b) => b.updated_at)
      .filter(Boolean)
      .sort()
      .at(-1);
    if (latest) setLastSyncedAt(latest);
  }

  return { added, updated };
}

export async function syncPush(config: SyncServerConfig): Promise<SyncEventResult> {
  if (!vaultIsUnlocked()) throw new Error("Vault is locked");

  const key = vaultRequireMasterKey();
  const payload = vaultGetPayload();
  let updated = 0;

  for (const host of payload.hosts) {
    await pushItem(key, config, "host", host.id, host);
    updated += 1;
  }
  for (const snippet of payload.snippets) {
    await pushItem(key, config, "snippet", snippet.id, snippet);
    updated += 1;
  }
  for (const sshKey of payload.keys) {
    await pushItem(key, config, "ssh_key", sshKey.id, sshKey);
    updated += 1;
  }

  return { added: 0, updated };
}

async function pushItem(
  key: Buffer,
  config: SyncServerConfig,
  itemType: string,
  itemRef: string,
  data: unknown,
) {
  const version = Math.max(1, getItemVersion(itemType, itemRef) + 1);
  const syncPayload: SyncPayload = {
    item_type: itemType,
    item_ref: itemRef,
    data: JSON.stringify(data),
    version,
  };
  const blob = encryptSyncPayload(key, syncPayload);
  await syncPushBlob(config, blob);
  setItemVersion(itemType, itemRef, version);
}

function applyHost(payload: ReturnType<typeof vaultGetPayload>, host: HostRecord) {
  const idx = payload.hosts.findIndex((h) => h.id === host.id);
  if (idx === -1) payload.hosts.push(host);
  else payload.hosts[idx] = host;
}

function applySnippet(payload: ReturnType<typeof vaultGetPayload>, snippet: SnippetRecord) {
  const idx = payload.snippets.findIndex((s) => s.id === snippet.id);
  if (idx === -1) payload.snippets.push(snippet);
  else payload.snippets[idx] = snippet;
}

function applyKey(payload: ReturnType<typeof vaultGetPayload>, sshKey: KeyRecord) {
  const idx = payload.keys.findIndex((k) => k.id === sshKey.id);
  if (idx === -1) payload.keys.push(sshKey);
  else payload.keys[idx] = sshKey;
}
