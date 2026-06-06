export const APP_LOCALES = ["en", "zh", "es", "tr", "de"] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  zh: "中文",
  es: "Español",
  tr: "Türkçe",
  de: "Deutsch",
};

export const LOCALE_BCP47: Record<AppLocale, string> = {
  en: "en-US",
  zh: "zh-CN",
  es: "es-ES",
  tr: "tr-TR",
  de: "de-DE",
};

const DEVICE_LOCALE_MAP: Record<string, AppLocale> = {
  en: "en",
  zh: "zh",
  es: "es",
  tr: "tr",
  de: "de",
};

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (APP_LOCALES as readonly string[]).includes(value);
}

/** Map browser / OS language tag to a supported app locale, or `en`. */
export function resolveDeviceLocale(
  languageTag: string = typeof navigator !== "undefined" ? navigator.language : DEFAULT_LOCALE,
): AppLocale {
  const normalized = languageTag.trim().toLowerCase().replace(/_/g, "-");
  if (!normalized) return DEFAULT_LOCALE;

  const [primary, region] = normalized.split("-");

  if (primary === "zh") {
    // Simplified Chinese default; traditional maps to zh for now.
    return "zh";
  }

  const direct = DEVICE_LOCALE_MAP[primary];
  if (direct) return direct;

  // e.g. es-MX, de-AT
  if (region && primary in DEVICE_LOCALE_MAP) {
    return DEVICE_LOCALE_MAP[primary];
  }

  return DEFAULT_LOCALE;
}

const SETTINGS_STORAGE_KEY = "termsh-settings";

/** Read persisted locale before Zustand hydrates. */
export function readPersistedLocale(): AppLocale | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { locale?: unknown } };
    const locale = parsed.state?.locale;
    return isAppLocale(locale) ? locale : null;
  } catch {
    return null;
  }
}

export function resolveInitialLocale(): AppLocale {
  return readPersistedLocale() ?? resolveDeviceLocale();
}

export function toBcp47(locale: AppLocale): string {
  return LOCALE_BCP47[locale];
}
