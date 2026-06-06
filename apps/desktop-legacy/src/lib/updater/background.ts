import { isTauriRuntime } from "@/lib/env";

export type UpdateCheckResult = {
  available: boolean;
  version?: string;
};

export async function checkForUpdatesSilent(): Promise<UpdateCheckResult> {
  if (!isTauriRuntime()) return { available: false };

  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const update = await check();
    if (!update?.available) return { available: false };
    return { available: true, version: update.version };
  } catch {
    return { available: false };
  }
}

export async function notifyUpdateAvailable(version: string): Promise<void> {
  if (!isTauriRuntime()) return;

  try {
    const { isPermissionGranted, requestPermission, sendNotification } = await import(
      "@tauri-apps/plugin-notification"
    );
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === "granted";
    }
    if (!granted) return;

    const { i18n } = await import("@/i18n");
    await sendNotification({
      title: i18n.t("notificationTitle", { ns: "updater" }),
      body: i18n.t("notificationBody", { ns: "updater", version }),
    });
  } catch {
    // Bildirim izni yoksa sessizce geç.
  }
}

export async function installAvailableUpdate(): Promise<void> {
  if (!isTauriRuntime()) return;

  const [{ check }, { relaunch }] = await Promise.all([
    import("@tauri-apps/plugin-updater"),
    import("@tauri-apps/plugin-process"),
  ]);

  const update = await check();
  if (!update?.available) return;

  await update.downloadAndInstall();
  await relaunch();
}
