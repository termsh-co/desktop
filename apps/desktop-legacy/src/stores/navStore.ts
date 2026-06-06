import type { Host } from "@termsh/shared";
import { create } from "zustand";

export type AppView =
  | "hosts"
  | "terminal"
  | "snippets"
  | "remote"
  | "vault"
  | "keys"
  | "settings";

type NavState = {
  view: AppView;
  paletteOpen: boolean;
  hostDrawerOpen: boolean;
  hostDrawerHost: Host | null;
  setView: (view: AppView) => void;
  openPalette: () => void;
  closePalette: () => void;
  openHostDrawer: (host?: Host | null) => void;
  closeHostDrawer: () => void;
};

export const useNavStore = create<NavState>((set) => ({
  view: "hosts",
  paletteOpen: false,
  hostDrawerOpen: false,
  hostDrawerHost: null,
  setView: (view) => set({ view }),
  openPalette: () => set({ paletteOpen: true }),
  closePalette: () => set({ paletteOpen: false }),
  openHostDrawer: (host = null) => set({ hostDrawerOpen: true, hostDrawerHost: host }),
  closeHostDrawer: () => set({ hostDrawerOpen: false, hostDrawerHost: null }),
}));
