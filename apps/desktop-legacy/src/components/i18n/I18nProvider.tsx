import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { changeAppLanguage, i18n } from "@/i18n";
import { traySetLocale } from "@/lib/tray/ipc";
import { useSettingsStore } from "@/stores/settingsStore";

type Props = { children: React.ReactNode };

export function I18nProvider({ children }: Props) {
  const locale = useSettingsStore((s) => s.locale);

  useEffect(() => {
    void (async () => {
      if (i18n.language !== locale) {
        await changeAppLanguage(locale);
      }
      await traySetLocale(locale);
    })();
  }, [locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
