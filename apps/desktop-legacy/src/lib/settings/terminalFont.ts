export const TERMINAL_FONT_FAMILIES = [
  "JetBrains Mono",
  "SF Mono",
  "Menlo",
  "Fira Code",
  "Cascadia Code",
  "monospace",
] as const;

export type TerminalFontFamily = (typeof TERMINAL_FONT_FAMILIES)[number];

export const FONT_OPTIONS: { value: TerminalFontFamily; label: string }[] = [
  { value: "JetBrains Mono", label: "JetBrains Mono" },
  { value: "SF Mono", label: "SF Mono" },
  { value: "Menlo", label: "Menlo" },
  { value: "Fira Code", label: "Fira Code" },
  { value: "Cascadia Code", label: "Cascadia Code" },
  { value: "monospace", label: "monospace (sistem)" },
];

export const FONT_SIZE_OPTIONS = [11, 12, 13, 14, 15, 16, 18] as const;

export function buildFontFamilyCss(family: TerminalFontFamily): string {
  return `"${family}", monospace`;
}
