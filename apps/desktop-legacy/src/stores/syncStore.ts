import { create } from "zustand";
import { persist } from "zustand/middleware";
import { i18n } from "@/i18n";
import { formatAppError } from "@/lib/errors/appError";
import {
  syncDelete,
  syncPull,
  syncPush,
  syncStatus,
  type SyncConfig,
  type SyncStatus,
  type SyncEvent,
} from "@/lib/sync/ipc";

export type SyncState = {
  serverUrl: string;
  accessToken: string;
  enabled: boolean;
  autoSync: boolean;

  status: SyncStatus | null;
  syncing: boolean;
  lastResult: SyncEvent | null;
  error: string | null;

  setServerUrl: (url: string) => void;
  setAccessToken: (token: string) => void;
  setEnabled: (enabled: boolean) => void;
  setAutoSync: (on: boolean) => void;
  checkStatus: () => Promise<void>;
  triggerPull: () => Promise<void>;
  triggerPush: () => Promise<void>;
  triggerDelete: (itemType: string, itemRef: string) => Promise<void>;
  runAutoSync: () => Promise<void>;
  clearError: () => void;
};

function buildConfig(state: SyncState): SyncConfig | null {
  if (!state.serverUrl || !state.accessToken) return null;
  return { apiUrl: state.serverUrl, accessToken: state.accessToken };
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      serverUrl: "",
      accessToken: "",
      enabled: false,
      autoSync: false,
      status: null,
      syncing: false,
      lastResult: null,
      error: null,

      setServerUrl: (serverUrl) => set({ serverUrl, error: null }),
      setAccessToken: (accessToken) => set({ accessToken, error: null }),
      setEnabled: (enabled) => set({ enabled, error: null }),
      setAutoSync: (autoSync) => set({ autoSync }),
      clearError: () => set({ error: null }),

      checkStatus: async () => {
        const config = buildConfig(get());
        if (!config) {
          set({ status: null, error: i18n.t("settings:sync.serverRequired") });
          return;
        }
        set({ syncing: true, error: null });
        try { const s = await syncStatus(config); set({ status: s, syncing: false }); }
        catch (err) { set({ syncing: false, error: formatAppError(err) }); }
      },

      triggerPull: async () => {
        const config = buildConfig(get());
        if (!config) return;
        set({ syncing: true, error: null });
        try { const r = await syncPull(config); set({ lastResult: r, syncing: false }); }
        catch (err) { set({ syncing: false, error: formatAppError(err) }); }
      },

      triggerPush: async () => {
        const config = buildConfig(get());
        if (!config) return;
        set({ syncing: true, error: null });
        try { const r = await syncPush(config); set({ lastResult: r, syncing: false }); }
        catch (err) { set({ syncing: false, error: formatAppError(err) }); }
      },

      triggerDelete: async (itemType, itemRef) => {
        const config = buildConfig(get());
        if (!config) return;
        set({ syncing: true, error: null });
        try { await syncDelete(config, itemType, itemRef); set({ syncing: false }); }
        catch (err) { set({ syncing: false, error: formatAppError(err) }); }
      },

      runAutoSync: async () => {
        const s = get();
        if (!s.enabled || !s.autoSync) return;
        const config = buildConfig(s);
        if (!config) return;
        if (s.syncing) return;
        set({ syncing: true, error: null });
        try {
          const pushed = await syncPush(config);
          const pulled = await syncPull(config);
          set({ lastResult: { added: pulled.added, updated: pushed.updated + pulled.updated }, syncing: false });
        } catch (err) {
          set({ syncing: false, error: formatAppError(err) });
        }
      },
    }),
    {
      name: "termsh-sync",
      version: 2,
      partialize: (state) => ({
        serverUrl: state.serverUrl,
        accessToken: state.accessToken,
        enabled: state.enabled,
        autoSync: state.autoSync,
      }),
    },
  ),
);

/** Sync interval — call once on app mount */
let _interval: ReturnType<typeof setInterval> | null = null;
export function startAutoSyncTimer() {
  if (_interval) return;
  _interval = setInterval(() => {
    useSyncStore.getState().runAutoSync();
  }, 5 * 60 * 1000); // every 5 minutes
}
