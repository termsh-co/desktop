import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import {
  APP_LOCALES,
  DEFAULT_LOCALE,
  type AppLocale,
  toBcp47,
} from "@/i18n/locale";

import enCommon from "@/i18n/resources/en/common.json";
import enSettings from "@/i18n/resources/en/settings.json";
import enHosts from "@/i18n/resources/en/hosts.json";
import enVault from "@/i18n/resources/en/vault.json";
import enTerminal from "@/i18n/resources/en/terminal.json";
import enPalette from "@/i18n/resources/en/palette.json";
import enSnippets from "@/i18n/resources/en/snippets.json";
import enKeys from "@/i18n/resources/en/keys.json";
import enRemote from "@/i18n/resources/en/remote.json";
import enSession from "@/i18n/resources/en/session.json";
import enUpdater from "@/i18n/resources/en/updater.json";
import enErrors from "@/i18n/resources/en/errors.json";

import trCommon from "@/i18n/resources/tr/common.json";
import trSettings from "@/i18n/resources/tr/settings.json";
import trHosts from "@/i18n/resources/tr/hosts.json";
import trVault from "@/i18n/resources/tr/vault.json";
import trTerminal from "@/i18n/resources/tr/terminal.json";
import trPalette from "@/i18n/resources/tr/palette.json";
import trSnippets from "@/i18n/resources/tr/snippets.json";
import trKeys from "@/i18n/resources/tr/keys.json";
import trRemote from "@/i18n/resources/tr/remote.json";
import trSession from "@/i18n/resources/tr/session.json";
import trUpdater from "@/i18n/resources/tr/updater.json";
import trErrors from "@/i18n/resources/tr/errors.json";

import zhCommon from "@/i18n/resources/zh/common.json";
import zhSettings from "@/i18n/resources/zh/settings.json";
import zhHosts from "@/i18n/resources/zh/hosts.json";
import zhVault from "@/i18n/resources/zh/vault.json";
import zhTerminal from "@/i18n/resources/zh/terminal.json";
import zhPalette from "@/i18n/resources/zh/palette.json";
import zhSnippets from "@/i18n/resources/zh/snippets.json";
import zhKeys from "@/i18n/resources/zh/keys.json";
import zhRemote from "@/i18n/resources/zh/remote.json";
import zhSession from "@/i18n/resources/zh/session.json";
import zhUpdater from "@/i18n/resources/zh/updater.json";
import zhErrors from "@/i18n/resources/zh/errors.json";

import esCommon from "@/i18n/resources/es/common.json";
import esSettings from "@/i18n/resources/es/settings.json";
import esHosts from "@/i18n/resources/es/hosts.json";
import esVault from "@/i18n/resources/es/vault.json";
import esTerminal from "@/i18n/resources/es/terminal.json";
import esPalette from "@/i18n/resources/es/palette.json";
import esSnippets from "@/i18n/resources/es/snippets.json";
import esKeys from "@/i18n/resources/es/keys.json";
import esRemote from "@/i18n/resources/es/remote.json";
import esSession from "@/i18n/resources/es/session.json";
import esUpdater from "@/i18n/resources/es/updater.json";
import esErrors from "@/i18n/resources/es/errors.json";

import deCommon from "@/i18n/resources/de/common.json";
import deSettings from "@/i18n/resources/de/settings.json";
import deHosts from "@/i18n/resources/de/hosts.json";
import deVault from "@/i18n/resources/de/vault.json";
import deTerminal from "@/i18n/resources/de/terminal.json";
import dePalette from "@/i18n/resources/de/palette.json";
import deSnippets from "@/i18n/resources/de/snippets.json";
import deKeys from "@/i18n/resources/de/keys.json";
import deRemote from "@/i18n/resources/de/remote.json";
import deSession from "@/i18n/resources/de/session.json";
import deUpdater from "@/i18n/resources/de/updater.json";
import deErrors from "@/i18n/resources/de/errors.json";

const NAMESPACES = [
  "common",
  "settings",
  "hosts",
  "vault",
  "terminal",
  "palette",
  "snippets",
  "keys",
  "remote",
  "session",
  "updater",
  "errors",
] as const;

const resources = {
  en: {
    common: enCommon,
    settings: enSettings,
    hosts: enHosts,
    vault: enVault,
    terminal: enTerminal,
    palette: enPalette,
    snippets: enSnippets,
    keys: enKeys,
    remote: enRemote,
    session: enSession,
    updater: enUpdater,
    errors: enErrors,
  },
  tr: {
    common: trCommon,
    settings: trSettings,
    hosts: trHosts,
    vault: trVault,
    terminal: trTerminal,
    palette: trPalette,
    snippets: trSnippets,
    keys: trKeys,
    remote: trRemote,
    session: trSession,
    updater: trUpdater,
    errors: trErrors,
  },
  zh: {
    common: zhCommon,
    settings: zhSettings,
    hosts: zhHosts,
    vault: zhVault,
    terminal: zhTerminal,
    palette: zhPalette,
    snippets: zhSnippets,
    keys: zhKeys,
    remote: zhRemote,
    session: zhSession,
    updater: zhUpdater,
    errors: zhErrors,
  },
  es: {
    common: esCommon,
    settings: esSettings,
    hosts: esHosts,
    vault: esVault,
    terminal: esTerminal,
    palette: esPalette,
    snippets: esSnippets,
    keys: esKeys,
    remote: esRemote,
    session: esSession,
    updater: esUpdater,
    errors: esErrors,
  },
  de: {
    common: deCommon,
    settings: deSettings,
    hosts: deHosts,
    vault: deVault,
    terminal: deTerminal,
    palette: dePalette,
    snippets: deSnippets,
    keys: deKeys,
    remote: deRemote,
    session: deSession,
    updater: deUpdater,
    errors: deErrors,
  },
} as const;

let initialized = false;

export function initI18n(locale: AppLocale): typeof i18n {
  if (initialized) {
    void i18n.changeLanguage(locale);
    document.documentElement.lang = toBcp47(locale);
    return i18n;
  }

  void i18n.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...APP_LOCALES],
    nonExplicitSupportedLngs: false,
    defaultNS: "common",
    ns: [...NAMESPACES],
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  });

  document.documentElement.lang = toBcp47(locale);
  initialized = true;
  return i18n;
}

export async function changeAppLanguage(locale: AppLocale): Promise<void> {
  await i18n.changeLanguage(locale);
  document.documentElement.lang = toBcp47(locale);
}

export { i18n, resources };
