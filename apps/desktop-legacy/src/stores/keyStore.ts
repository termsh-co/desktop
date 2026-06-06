import { create } from "zustand";
import { formatAppError } from "@/lib/errors/appError";
import type { SshKey } from "@termsh/shared";
import {
  deleteKey,
  generateKey,
  listKeys,
  saveKey,
  type GenerateKeyPayload,
  type GenerateKeyResult,
  type SaveKeyPayload,
} from "@/lib/keys/ipc";

type KeyState = {
  keys: SshKey[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  save: (payload: SaveKeyPayload) => Promise<SshKey>;
  generate: (payload: GenerateKeyPayload) => Promise<GenerateKeyResult>;
  remove: (id: string) => Promise<void>;
  clear: () => void;
};

export const useKeyStore = create<KeyState>((set) => ({
  keys: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const keys = await listKeys();
      set({ keys, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: formatAppError(err),
      });
    }
  },

  save: async (payload) => {
    const key = await saveKey(payload);
    set((state) => {
      const exists = state.keys.some((k) => k.id === key.id);
      const keys = exists ? state.keys.map((k) => (k.id === key.id ? key : k)) : [key, ...state.keys];
      return { keys, error: null };
    });
    return key;
  },

  generate: async (payload) => {
    const result = await generateKey(payload);
    set((state) => {
      const exists = state.keys.some((k) => k.id === result.key.id);
      const keys = exists
        ? state.keys.map((k) => (k.id === result.key.id ? result.key : k))
        : [result.key, ...state.keys];
      return { keys, error: null };
    });
    return result;
  },

  remove: async (id) => {
    await deleteKey(id);
    set((state) => ({ keys: state.keys.filter((k) => k.id !== id), error: null }));
  },

  clear: () => set({ keys: [], loading: false, error: null }),
}));

/** @internal */
export function resetKeyStoreForTests() {
  useKeyStore.setState({ keys: [], loading: false, error: null });
}

