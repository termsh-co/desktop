import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

export async function showMainWindow(): Promise<void> {
  await invoke("show_main_window");
}

export async function startDraggingMainWindow(): Promise<void> {
  const win = getCurrentWindow();
  await win.startDragging();
}
