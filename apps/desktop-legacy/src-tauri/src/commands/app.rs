use crate::error::AppError;
use serde::Serialize;
use tauri::AppHandle;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    pub name: String,
    pub version: String,
}

#[tauri::command]
pub fn app_info() -> AppInfo {
    AppInfo {
        name: "termsh".into(),
        version: env!("CARGO_PKG_VERSION").into(),
    }
}

#[tauri::command]
pub fn tray_set_locale(app: AppHandle, locale: String) -> Result<(), AppError> {
    crate::tray::set_locale(&app, &locale).map_err(|e| AppError::unknown(e.to_string()))
}
