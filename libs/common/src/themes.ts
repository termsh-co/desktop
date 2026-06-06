import type { ITheme } from "@xterm/xterm";

export type ThemeId = "rego" | "aurora" | "ember" | "obsidian" | "forest" | "light";

export const THEME_IDS: ThemeId[] = [
  "rego",
  "aurora",
  "ember",
  "obsidian",
  "forest",
  "light",
];

const regoXterm: ITheme = {
  background: "#000d24",
  foreground: "#e8eef8",
  cursor: "#5eb0ff",
  cursorAccent: "#001d49",
  selectionBackground: "rgba(94, 176, 255, 0.28)",
  black: "#0a1220",
  red: "#ff8a80",
  green: "#69f0ae",
  yellow: "#ffd54f",
  blue: "#5eb0ff",
  magenta: "#b388ff",
  cyan: "#5eb8ff",
  white: "#e8eef8",
  brightBlack: "#5c6b82",
  brightRed: "#ffab91",
  brightGreen: "#b9f6ca",
  brightYellow: "#ffe082",
  brightBlue: "#82b1ff",
  brightMagenta: "#d0bfff",
  brightCyan: "#84ffff",
  brightWhite: "#ffffff",
};

const auroraXterm: ITheme = {
  background: "#1a1f29",
  foreground: "#d8dee9",
  cursor: "#88c0d0",
  cursorAccent: "#2e3440",
  selectionBackground: "rgba(136, 192, 208, 0.28)",
  black: "#1a1f29",
  red: "#bf616a",
  green: "#a3be8c",
  yellow: "#ebcb8b",
  blue: "#81a1c1",
  magenta: "#b48ead",
  cyan: "#88c0d0",
  white: "#eceff4",
  brightBlack: "#4c566a",
  brightRed: "#d08770",
  brightGreen: "#8fbcbb",
  brightYellow: "#ebcb8b",
  brightBlue: "#5e81ac",
  brightMagenta: "#b48ead",
  brightCyan: "#8fbcbb",
  brightWhite: "#e5e9f0",
};

const emberXterm: ITheme = {
  background: "#1d2021",
  foreground: "#ebdbb2",
  cursor: "#fabd2f",
  cursorAccent: "#1d2021",
  selectionBackground: "rgba(250, 189, 47, 0.22)",
  black: "#1d2021",
  red: "#fb4934",
  green: "#b8bb26",
  yellow: "#fabd2f",
  blue: "#83a598",
  magenta: "#d3869b",
  cyan: "#8ec07c",
  white: "#ebdbb2",
  brightBlack: "#665c54",
  brightRed: "#fe8019",
  brightGreen: "#b8bb26",
  brightYellow: "#fabd2f",
  brightBlue: "#83a598",
  brightMagenta: "#d3869b",
  brightCyan: "#8ec07c",
  brightWhite: "#fbf1c7",
};

const obsidianXterm: ITheme = {
  background: "#11111b",
  foreground: "#cdd6f4",
  cursor: "#f5c2e7",
  cursorAccent: "#11111b",
  selectionBackground: "rgba(203, 166, 247, 0.28)",
  black: "#11111b",
  red: "#f38ba8",
  green: "#a6e3a1",
  yellow: "#f9e2af",
  blue: "#89b4fa",
  magenta: "#cba6f7",
  cyan: "#94e2d5",
  white: "#cdd6f4",
  brightBlack: "#585b70",
  brightRed: "#eba0ac",
  brightGreen: "#a6e3a1",
  brightYellow: "#f9e2af",
  brightBlue: "#89b4fa",
  brightMagenta: "#f5c2e7",
  brightCyan: "#94e2d5",
  brightWhite: "#bac2de",
};

const forestXterm: ITheme = {
  background: "#2b3339",
  foreground: "#d3c6aa",
  cursor: "#a7c080",
  cursorAccent: "#2b3339",
  selectionBackground: "rgba(167, 192, 128, 0.25)",
  black: "#2b3339",
  red: "#e67e80",
  green: "#a7c080",
  yellow: "#dbbc7f",
  blue: "#7fbbb3",
  magenta: "#d699b6",
  cyan: "#83c092",
  white: "#d3c6aa",
  brightBlack: "#4f585e",
  brightRed: "#e67e80",
  brightGreen: "#a7c080",
  brightYellow: "#dbbc7f",
  brightBlue: "#7fbbb3",
  brightMagenta: "#d699b6",
  brightCyan: "#83c092",
  brightWhite: "#ddedc7",
};

const lightXterm: ITheme = {
  background: "#ffffff",
  foreground: "#1d1d1f",
  cursor: "#001d49",
  cursorAccent: "#ffffff",
  selectionBackground: "rgba(0, 29, 73, 0.18)",
  black: "#e8e9ec",
  red: "#d73a49",
  green: "#22863a",
  yellow: "#b08800",
  blue: "#0366d6",
  magenta: "#6f42c1",
  cyan: "#1b7c83",
  white: "#1d1d1f",
  brightBlack: "#959da5",
  brightRed: "#cb2431",
  brightGreen: "#28a745",
  brightYellow: "#dbab09",
  brightBlue: "#005cc5",
  brightMagenta: "#5a32a3",
  brightCyan: "#3192aa",
  brightWhite: "#24292e",
};

const XTERM_BY_THEME: Record<ThemeId, ITheme> = {
  rego: regoXterm,
  aurora: auroraXterm,
  ember: emberXterm,
  obsidian: obsidianXterm,
  forest: forestXterm,
  light: lightXterm,
};

const LEGACY_THEME_IDS: Record<string, ThemeId> = {
  midnight: "aurora",
  solar: "ember",
};

export function normalizeThemeId(id: string): ThemeId {
  if (THEME_IDS.includes(id as ThemeId)) {
    return id as ThemeId;
  }
  return LEGACY_THEME_IDS[id] ?? "rego";
}

export function getXtermTheme(id: ThemeId): ITheme {
  return XTERM_BY_THEME[id] ?? regoXterm;
}
