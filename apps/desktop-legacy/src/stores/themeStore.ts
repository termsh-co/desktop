import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_THEME_ID, getTheme, normalizeThemeId, type ThemeId } from "@/lib/themes";

type ThemeState = {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
};

function applyThemeToDocument(id: ThemeId) {
  document.documentElement.dataset.theme = id;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: DEFAULT_THEME_ID,
      setTheme: (themeId) => {
        applyThemeToDocument(themeId);
        set({ themeId });
      },
    }),
    {
      name: "termsh-theme",
      version: 2,
      migrate: (persisted) => {
        const state = persisted as { themeId?: string };
        const id = normalizeThemeId(state.themeId ?? DEFAULT_THEME_ID);
        return { themeId: id };
      },
      onRehydrateStorage: () => (state) => {
        const raw = state?.themeId ?? DEFAULT_THEME_ID;
        const id = normalizeThemeId(raw);
        if (state && id !== raw) {
          state.themeId = id;
        }
        applyThemeToDocument(id);
      },
    },
  ),
);

/** @internal */
export function resetThemeStoreForTests() {
  useThemeStore.setState({ themeId: DEFAULT_THEME_ID });
  applyThemeToDocument(DEFAULT_THEME_ID);
}

export function getActiveXtermTheme() {
  return getTheme(useThemeStore.getState().themeId).xterm;
}
