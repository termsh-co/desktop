import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

/** macOS/iOS WebView otomatik büyük harf ve yazım düzeltmesini kapatır. */
export const noAutocapitalize = {
  autoCapitalize: "none",
  autoCorrect: "off",
  spellCheck: false,
} as const satisfies Pick<
  InputHTMLAttributes<HTMLInputElement>,
  "autoCapitalize" | "autoCorrect" | "spellCheck"
> &
  Pick<TextareaHTMLAttributes<HTMLTextAreaElement>, "spellCheck">;
