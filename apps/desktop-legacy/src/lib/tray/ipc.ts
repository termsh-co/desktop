import { invoke } from "@tauri-apps/api/core";
import type { AppLocale } from "@/i18n/locale";
import { isTauriRuntime } from "@/lib/env";

export async function traySetLocale(locale: AppLocale): Promise<void> {
  if (!isTauriRuntime()) return;
  try {
    await invoke("tray_set_locale", { locale });
  } catch {
    /* tray is desktop-only; ignore when unavailable */
  }
}
