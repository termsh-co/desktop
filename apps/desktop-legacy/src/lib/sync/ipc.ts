import { invoke } from "@tauri-apps/api/core";

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

/** Sunucuya bağlantı durumunu kontrol et */
export async function syncStatus(config: SyncConfig): Promise<SyncStatus> {
  return invoke("sync_status", { config });
}

/** Sunucudan güncel verileri çek */
export async function syncPull(config: SyncConfig): Promise<SyncEvent> {
  return invoke("sync_pull", { config });
}

/** Yerel değişiklikleri sunucuya gönder */
export async function syncPush(config: SyncConfig): Promise<SyncEvent> {
  return invoke("sync_push", { config });
}

/** Sunucudan bir öğeyi sil */
export async function syncDelete(
  config: SyncConfig,
  itemType: string,
  itemRef: string,
): Promise<void> {
  return invoke("sync_delete", {
    payload: { apiUrl: config.apiUrl, accessToken: config.accessToken, itemType, itemRef },
  });
}
