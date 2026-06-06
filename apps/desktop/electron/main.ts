import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "node:path";
import { bindAutoLockIpc, resetAutoLockTimer, stopAutoLockTimer } from "./auto-lock";
import { detectAndSaveHostPlatform } from "./host-platform-detect";
import { hostCredentials, hostsDelete, hostsList, hostsSave } from "./hosts-store";
import { keysDelete, keysGenerate, keysList, keysSave } from "./keys-store";
import { closeAllPty, closePty, resizePty, spawnLocalPty, spawnSshPty, writePty } from "./pty-manager";
import { localCopyInto, localHomeDir, listLocalDir } from "./local-fs";
import { downloadRemoteFile, listRemoteDir, uploadRemoteFile } from "./remote-fs";
import { snippetsDelete, snippetsList, snippetsSave } from "./snippets-store";
import { syncPull, syncPush, syncStatus } from "./sync-engine";
import { setupTray } from "./tray";
import { bindUpdaterIpc, scheduleStartupUpdateCheck } from "./updater";
import { keychainIsAvailable } from "./vault-keychain";
import {
  vaultForgetKeychain,
  vaultLock,
  vaultSetup,
  vaultStatus,
  vaultTryBiometricUnlock,
  vaultTryKeychainUnlock,
  vaultUnlock,
  type VaultUnlockOptions,
} from "./vault-store";

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const isMac = process.platform === "darwin";
  const devUrl = "http://127.0.0.1:4200";
  let devLoadAttempts = 0;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "termsh",
    show: isDev,
    autoHideMenuBar: true,
    ...(isMac && !isDev
      ? {
          titleBarStyle: "hidden",
          trafficLightPosition: { x: 14, y: 16 },
          transparent: true,
          backgroundColor: "#00000000",
        }
      : isMac
        ? {
            titleBarStyle: "hiddenInset",
            backgroundColor: "#1a1a1a",
          }
        : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isMac && mainWindow) {
    mainWindow.setWindowButtonPosition({ x: 14, y: 16 });
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  const loadDev = () => {
    if (!mainWindow) return;
    devLoadAttempts += 1;
    void mainWindow.loadURL(devUrl);
  };

  mainWindow.webContents.on("did-fail-load", (_event, code, description, url) => {
    console.error("[termsh] Page load failed:", code, description, url);
    mainWindow?.show();
    if (isDev && url.startsWith(devUrl) && devLoadAttempts < 30) {
      console.warn(`[termsh] Retrying dev URL (${devLoadAttempts}/30)…`);
      setTimeout(loadDev, 1500);
    }
  });

  mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    if (isDev && level >= 2) {
      console.error(`[renderer] ${message} (${sourceId}:${line})`);
    }
  });

  // Dev fallback: never keep the window hidden if ready-to-show never fires
  if (isDev) {
    setTimeout(() => {
      if (mainWindow && !mainWindow.isVisible()) {
        console.warn("[termsh] Force-showing window (ready-to-show timeout)");
        mainWindow.show();
        mainWindow.focus();
      }
    }, 5000);
  }

  mainWindow.webContents.on("did-finish-load", () => {
    if (isDev) {
      mainWindow?.show();
      mainWindow?.focus();
    }
    const platformClass = isMac ? "platform-macos" : "platform-desktop";
    void mainWindow?.webContents.executeJavaScript(
      `document.documentElement.classList.add("${platformClass}")`,
    );
  });

  if (isDev) {
    loadDev();
    if (process.env.TERMSH_DEVTOOLS === "1") {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }
  } else {
    void mainWindow.loadFile(
      path.join(__dirname, "../dist/apps/desktop/browser/index.html"),
    );
  }
}

app.whenReady().then(() => {
  console.log("[termsh] Electron ready, creating window…");
  ipcMain.handle("termsh:version", () => app.getVersion());
  ipcMain.handle("termsh:app-info", () => ({ name: "termsh", version: app.getVersion() }));
  ipcMain.handle("termsh:core-version", () => {
    try {
      const napi = require("@termsh/core-napi");
      return napi.coreVersion();
    } catch {
      return "napi-unavailable";
    }
  });

  ipcMain.handle("termsh:keychain-available", () => keychainIsAvailable());
  ipcMain.handle("termsh:vault-status", () => vaultStatus());
  ipcMain.handle("termsh:vault-setup", async (_event, password: string, options?: VaultUnlockOptions) => {
    await vaultSetup(password, options);
    resetAutoLockTimer();
  });
  ipcMain.handle("termsh:vault-unlock", async (_event, password: string, options?: VaultUnlockOptions) => {
    await vaultUnlock(password, options);
    resetAutoLockTimer();
  });
  ipcMain.handle("termsh:vault-try-keychain-unlock", async () => vaultTryKeychainUnlock());
  ipcMain.handle("termsh:vault-try-biometric-unlock", async () => vaultTryBiometricUnlock());
  ipcMain.handle("termsh:vault-forget-keychain", async () => vaultForgetKeychain());
  ipcMain.handle("termsh:vault-lock", () => {
    vaultLock();
    stopAutoLockTimer();
  });

  bindAutoLockIpc(ipcMain);

  ipcMain.handle("termsh:pty-available", async () => {
    try {
      const mod = await import("node-pty");
      return typeof mod.spawn === "function";
    } catch {
      return false;
    }
  });

  ipcMain.handle(
    "termsh:pty-spawn-local",
    (event, sessionId: string, cols: number, rows: number) => {
      spawnLocalPty(sessionId, cols, rows, event.sender);
    },
  );

  ipcMain.handle(
    "termsh:pty-spawn-ssh",
    (
      event,
      sessionId: string,
      hostId: string,
      cols: number,
      rows: number,
      passwordOverride?: string,
    ) => {
      const host = hostsList().find((h) => h.id === hostId);
      if (!host) throw new Error("Host not found");
      const creds = hostCredentials(hostId);
      spawnSshPty(
        sessionId,
        {
          hostname: host.hostname,
          port: host.port,
          username: host.username,
          privateKeyPem: creds.privateKey,
          password: passwordOverride?.trim() || creds.password,
        },
        cols,
        rows,
        event.sender,
      );
    },
  );

  ipcMain.on("termsh:pty-write", (_event, sessionId: string, data: string) => {
    writePty(sessionId, data);
  });

  ipcMain.on("termsh:pty-resize", (_event, sessionId: string, cols: number, rows: number) => {
    resizePty(sessionId, cols, rows);
  });

  ipcMain.handle("termsh:pty-close", (_event, sessionId: string) => {
    closePty(sessionId);
  });

  ipcMain.handle("termsh:hosts-list", () => {
    resetAutoLockTimer();
    return hostsList();
  });
  ipcMain.handle("termsh:hosts-save", (_event, payload: unknown) => {
    resetAutoLockTimer();
    return hostsSave(payload as Parameters<typeof hostsSave>[0]);
  });
  ipcMain.handle("termsh:hosts-delete", (_event, id: string) => {
    resetAutoLockTimer();
    hostsDelete(id);
  });

  ipcMain.handle(
    "termsh:hosts-detect-platform",
    (_event, hostId: string, passwordOverride?: string) => {
      resetAutoLockTimer();
      return detectAndSaveHostPlatform(hostId, passwordOverride);
    },
  );

  ipcMain.handle(
    "termsh:remote-list-dir",
    (_event, hostId: string, path: string, passwordOverride?: string) => {
      resetAutoLockTimer();
      return listRemoteDir(hostId, path, passwordOverride);
    },
  );

  ipcMain.handle("termsh:local-home-dir", () => {
    resetAutoLockTimer();
    return localHomeDir();
  });

  ipcMain.handle("termsh:local-list-dir", (_event, path: string) => {
    resetAutoLockTimer();
    return listLocalDir(path);
  });

  ipcMain.handle(
    "termsh:local-copy-into",
    (_event, destDir: string, paths: string[]) => {
      resetAutoLockTimer();
      return localCopyInto(destDir, paths);
    },
  );

  ipcMain.handle(
    "termsh:remote-upload",
    (
      _event,
      hostId: string,
      localPath: string,
      remotePath: string,
      passwordOverride?: string,
    ) => {
      resetAutoLockTimer();
      return uploadRemoteFile(hostId, localPath, remotePath, passwordOverride);
    },
  );

  ipcMain.handle(
    "termsh:remote-download",
    (
      _event,
      hostId: string,
      remotePath: string,
      localPath: string,
      passwordOverride?: string,
    ) => {
      resetAutoLockTimer();
      return downloadRemoteFile(hostId, remotePath, localPath, passwordOverride);
    },
  );

  ipcMain.handle(
    "termsh:dialog-open-files",
    async (event, options?: { multiple?: boolean }) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      const dialogOptions = {
        properties: (options?.multiple
          ? ["openFile", "multiSelections"]
          : ["openFile"]) as Array<"openFile" | "multiSelections">,
      };
      const result = win
        ? await dialog.showOpenDialog(win, dialogOptions)
        : await dialog.showOpenDialog(dialogOptions);
      return result.canceled ? [] : result.filePaths;
    },
  );

  ipcMain.handle("termsh:snippets-list", () => {
    resetAutoLockTimer();
    return snippetsList();
  });
  ipcMain.handle("termsh:snippets-save", (_event, payload: unknown) => {
    resetAutoLockTimer();
    return snippetsSave(payload as Parameters<typeof snippetsSave>[0]);
  });
  ipcMain.handle("termsh:snippets-delete", (_event, id: string) => {
    resetAutoLockTimer();
    snippetsDelete(id);
  });

  ipcMain.handle("termsh:keys-list", () => {
    resetAutoLockTimer();
    return keysList();
  });
  ipcMain.handle("termsh:keys-save", (_event, payload: unknown) => {
    resetAutoLockTimer();
    return keysSave(payload as Parameters<typeof keysSave>[0]);
  });
  ipcMain.handle("termsh:keys-generate", (_event, payload: unknown) => {
    resetAutoLockTimer();
    return keysGenerate(payload as Parameters<typeof keysGenerate>[0]);
  });
  ipcMain.handle("termsh:keys-delete", (_event, id: string) => {
    resetAutoLockTimer();
    keysDelete(id);
  });

  ipcMain.handle(
    "termsh:sync-status",
    (_event, config: { apiUrl: string; accessToken: string }) => syncStatus(config),
  );
  ipcMain.handle(
    "termsh:sync-pull",
    (_event, config: { apiUrl: string; accessToken: string }) => syncPull(config),
  );
  ipcMain.handle(
    "termsh:sync-push",
    (_event, config: { apiUrl: string; accessToken: string }) => syncPush(config),
  );

  bindUpdaterIpc(() => mainWindow);
  createWindow();
  setupTray(() => mainWindow);
  scheduleStartupUpdateCheck();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  closeAllPty();
  if (process.platform !== "darwin") app.quit();
});
