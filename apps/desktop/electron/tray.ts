import { app, Menu, Tray, nativeImage, BrowserWindow } from "electron";
import path from "node:path";

let tray: Tray | null = null;

export function setupTray(getWindow: () => BrowserWindow | null) {
  if (tray) return;

  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip("termsh");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show termsh",
      click: () => {
        const win = getWindow();
        if (win) {
          win.show();
          win.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    const win = getWindow();
    if (win) {
      win.show();
      win.focus();
    }
  });
}
