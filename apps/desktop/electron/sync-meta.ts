import { readJson, writeJson } from "./data-store";

type SyncMetaFile = {
  lastSyncedAt?: string;
  versions: Record<string, string>;
};

function load(): SyncMetaFile {
  return readJson<SyncMetaFile>("sync-meta.json", { versions: {} });
}

function save(meta: SyncMetaFile) {
  writeJson("sync-meta.json", meta);
}

export function getLastSyncedAt(): string | undefined {
  return load().lastSyncedAt;
}

export function setLastSyncedAt(iso: string) {
  const meta = load();
  meta.lastSyncedAt = iso;
  save(meta);
}

export function getItemVersion(itemType: string, itemRef: string): number {
  const key = `version_${itemType}_${itemRef}`;
  const raw = load().versions[key];
  return raw ? Number.parseInt(raw, 10) || 0 : 0;
}

export function setItemVersion(itemType: string, itemRef: string, version: number) {
  const meta = load();
  meta.versions[`version_${itemType}_${itemRef}`] = String(version);
  save(meta);
}
