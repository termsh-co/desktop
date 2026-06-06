import { create } from "zustand";
import {
  checkForUpdatesSilent,
  installAvailableUpdate,
  notifyUpdateAvailable,
} from "@/lib/updater/background";

type UpdaterState = {
  updateAvailable: boolean;
  updateVersion: string | null;
  checking: boolean;
  lastNotifiedVersion: string | null;
  checkForUpdates: (options?: { notify?: boolean }) => Promise<void>;
  installUpdate: () => Promise<void>;
  dismissUpdate: () => void;
};

export const useUpdaterStore = create<UpdaterState>((set, get) => ({
  updateAvailable: false,
  updateVersion: null,
  checking: false,
  lastNotifiedVersion: null,

  checkForUpdates: async (options) => {
    if (get().checking) return;
    set({ checking: true });
    try {
      const result = await checkForUpdatesSilent();
      if (result.available && result.version) {
        const notify =
          options?.notify !== false && result.version !== get().lastNotifiedVersion;
        set({ updateAvailable: true, updateVersion: result.version });
        if (notify) {
          await notifyUpdateAvailable(result.version);
          set({ lastNotifiedVersion: result.version });
        }
      } else {
        set({ updateAvailable: false, updateVersion: null });
      }
    } finally {
      set({ checking: false });
    }
  },

  installUpdate: async () => {
    await installAvailableUpdate();
    set({ updateAvailable: false, updateVersion: null });
  },

  dismissUpdate: () => set({ updateAvailable: false }),
}));

/** @internal */
export function resetUpdaterStoreForTests() {
  useUpdaterStore.setState({
    updateAvailable: false,
    updateVersion: null,
    checking: false,
    lastNotifiedVersion: null,
  });
}
