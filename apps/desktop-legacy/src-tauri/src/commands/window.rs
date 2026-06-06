use crate::tray;
use tauri::{AppHandle, Runtime};

#[tauri::command]
pub fn show_main_window<R: Runtime>(app: AppHandle<R>) {
    tray::show_main_window(&app);
}
