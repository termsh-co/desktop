/** i18n JSON roots — copied from desktop-legacy (en, tr, de, es, zh). */
export const I18N_LOCALES = ["en", "tr", "de", "es", "zh"] as const;
export type I18nLocale = (typeof I18N_LOCALES)[number];
