import { listen } from "@tauri-apps/api/event";
import { create } from "zustand";
import { formatAppError } from "@/lib/errors/appError";
import type { Host, HostPlatform, SaveHostPayload } from "@termsh/shared";
import { deleteHost, listHosts, saveHost } from "@/lib/hosts/ipc";

type HostPlatformEvent = {
  hostId: string;
  platform: HostPlatform;
};

type HostState = {
  hosts: Host[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  save: (payload: SaveHostPayload) => Promise<Host>;
  remove: (id: string) => Promise<void>;
  patchPlatform: (hostId: string, platform: HostPlatform) => void;
  clear: () => void;
};

let platformListenerStarted = false;

function startPlatformListener() {
  if (platformListenerStarted) return;
  platformListenerStarted = true;
  void listen<HostPlatformEvent>("host-platform-detected", (event) => {
    useHostStore.getState().patchPlatform(event.payload.hostId, event.payload.platform);
  });
}

export const useHostStore = create<HostState>((set) => ({
  hosts: [],
  loading: false,
  error: null,

  load: async () => {
    startPlatformListener();
    set({ loading: true, error: null });
    try {
      const hosts = await listHosts();
      set({ hosts, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: formatAppError(err),
      });
    }
  },

  save: async (payload) => {
    const host = await saveHost(payload);
    set((state) => {
      const exists = state.hosts.some((h) => h.id === host.id);
      const hosts = exists
        ? state.hosts.map((h) => (h.id === host.id ? host : h))
        : [...state.hosts, host];
      return { hosts, error: null };
    });
    return host;
  },

  remove: async (id) => {
    await deleteHost(id);
    set((state) => ({
      hosts: state.hosts.filter((h) => h.id !== id),
      error: null,
    }));
  },

  patchPlatform: (hostId, platform) => {
    set((state) => ({
      hosts: state.hosts.map((h) => (h.id === hostId ? { ...h, platform } : h)),
    }));
  },

  clear: () => set({ hosts: [], loading: false, error: null }),
}));

/** @internal */
export function resetHostStoreForTests() {
  useHostStore.setState({ hosts: [], loading: false, error: null });
}
