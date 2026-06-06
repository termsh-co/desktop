import { create } from "zustand";

export type SplitMode = "off" | "vertical" | "horizontal";

type TerminalLayoutState = {
  splitMode: SplitMode;
  secondarySessionId: string | null;
  setSplitMode: (mode: SplitMode) => void;
  toggleSplitMode: () => void;
  setSecondarySessionId: (id: string | null) => void;
  reset: () => void;
};

export const useTerminalLayoutStore = create<TerminalLayoutState>((set, get) => ({
  splitMode: "off",
  secondarySessionId: null,

  setSplitMode: (mode) =>
    set((state) => ({
      splitMode: mode,
      secondarySessionId: mode === "off" ? null : state.secondarySessionId,
    })),

  toggleSplitMode: () => {
    const { splitMode } = get();
    const next: SplitMode =
      splitMode === "off" ? "vertical" : splitMode === "vertical" ? "horizontal" : "off";
    set((state) => ({
      splitMode: next,
      secondarySessionId: next === "off" ? null : state.secondarySessionId,
    }));
  },

  setSecondarySessionId: (id) => set({ secondarySessionId: id }),

  reset: () => set({ splitMode: "off", secondarySessionId: null }),
}));

/** @internal */
export function resetTerminalLayoutStoreForTests() {
  useTerminalLayoutStore.getState().reset();
}

