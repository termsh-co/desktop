import { create } from "zustand";
import { formatAppError } from "@/lib/errors/appError";
import type { Snippet } from "@termsh/shared";
import {
  deleteSnippet,
  listSnippets,
  saveSnippet,
  type SaveSnippetPayload,
} from "@/lib/snippets/ipc";

type SnippetState = {
  snippets: Snippet[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  save: (payload: SaveSnippetPayload) => Promise<Snippet>;
  remove: (id: string) => Promise<void>;
  clear: () => void;
};

export const useSnippetStore = create<SnippetState>((set) => ({
  snippets: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const snippets = await listSnippets();
      set({ snippets, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: formatAppError(err),
      });
    }
  },

  save: async (payload) => {
    const snippet = await saveSnippet(payload);
    set((state) => {
      const exists = state.snippets.some((s) => s.id === snippet.id);
      const snippets = exists
        ? state.snippets.map((s) => (s.id === snippet.id ? snippet : s))
        : [snippet, ...state.snippets];
      return { snippets, error: null };
    });
    return snippet;
  },

  remove: async (id) => {
    await deleteSnippet(id);
    set((state) => ({
      snippets: state.snippets.filter((s) => s.id !== id),
      error: null,
    }));
  },

  clear: () => set({ snippets: [], loading: false, error: null }),
}));

/** @internal */
export function resetSnippetStoreForTests() {
  useSnippetStore.setState({ snippets: [], loading: false, error: null });
}

