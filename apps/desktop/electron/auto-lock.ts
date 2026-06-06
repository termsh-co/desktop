import { BrowserWindow, type IpcMain } from "electron";
import { vaultIsUnlocked, vaultLock } from "./vault-store";

const DEFAULT_IDLE_MS = 15 * 60 * 1000;

let idleMs = DEFAULT_IDLE_MS;
let timer: ReturnType<typeof setTimeout> | null = null;

export function configureAutoLock(idleMinutes: number) {
  if (idleMinutes <= 0) {
    idleMs = 0;
    stopAutoLockTimer();
    return;
  }
  idleMs = idleMinutes * 60 * 1000;
  resetAutoLockTimer();
}

export function resetAutoLockTimer() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (!vaultIsUnlocked() || idleMs <= 0) return;
  timer = setTimeout(() => {
    vaultLock();
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send("termsh:vault-locked");
    }
  }, idleMs);
}

export function stopAutoLockTimer() {
  if (timer) clearTimeout(timer);
  timer = null;
}

export function bindAutoLockIpc(ipcMain: IpcMain) {
  ipcMain.on("termsh:activity", () => resetAutoLockTimer());
  ipcMain.handle("termsh:auto-lock-config", (_event, idleMinutes: number) => {
    configureAutoLock(idleMinutes);
  });
}
