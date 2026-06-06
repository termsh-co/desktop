import { app, ipcMain, type BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";

export type UpdateCheckResult = {
  available: boolean;
  version?: string;
  error?: string;
  dev?: boolean;
};

let getMainWindow: (() => BrowserWindow | null) | null = null;

export function bindUpdaterIpc(resolveWindow: () => BrowserWindow | null): void {
  getMainWindow = resolveWindow;
  autoUpdater.autoDownload = false;

  const notify = (channel: string, payload?: unknown) => {
    const win = getMainWindow?.();
    if (!win || win.webContents.isDestroyed()) return;
    if (payload === undefined) {
      win.webContents.send(channel);
    } else {
      win.webContents.send(channel, payload);
    }
  };

  autoUpdater.on("update-available", (info) => {
    notify("termsh:updater-available", { version: info.version });
  });

  autoUpdater.on("update-not-available", () => {
    notify("termsh:updater-not-available");
  });

  autoUpdater.on("update-downloaded", () => {
    notify("termsh:updater-downloaded");
  });

  autoUpdater.on("error", (err) => {
    notify("termsh:updater-error", { message: err.message });
  });

  ipcMain.handle("termsh:updater-check", async (): Promise<UpdateCheckResult> => {
    if (!app.isPackaged) {
      return { available: false, dev: true };
    }
    try {
      const result = await autoUpdater.checkForUpdates();
      const version = result?.updateInfo?.version;
      if (version && version !== app.getVersion()) {
        return { available: true, version };
      }
      return { available: false };
    } catch (err) {
      return {
        available: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  ipcMain.handle("termsh:updater-install", async () => {
    if (!app.isPackaged) return;
    await autoUpdater.downloadUpdate();
    autoUpdater.quitAndInstall(false, true);
  });
}

export function scheduleStartupUpdateCheck(): void {
  if (!app.isPackaged) return;
  autoUpdater.checkForUpdatesAndNotify().catch(() => undefined);
}
