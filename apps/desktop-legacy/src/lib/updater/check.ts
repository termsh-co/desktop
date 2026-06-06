import { i18n } from "@/i18n";
import { isTauriRuntime } from "@/lib/env";
import { checkForUpdatesSilent, installAvailableUpdate } from "@/lib/updater/background";

export async function checkForUpdatesInteractive(): Promise<void> {
  if (!isTauriRuntime()) return;

  const { ask } = await import("@tauri-apps/plugin-dialog");
  const result = await checkForUpdatesSilent();

  if (!result.available) {
    await ask(i18n.t("noUpdate", { ns: "updater" }), {
      title: "termsh",
      kind: "info",
    });
    return;
  }

  const yes = await ask(
    i18n.t("updateReady", { ns: "updater", version: result.version }),
    {
      title: i18n.t("title", { ns: "updater" }),
      kind: "info",
    },
  );
  if (!yes) return;

  await installAvailableUpdate();
}
