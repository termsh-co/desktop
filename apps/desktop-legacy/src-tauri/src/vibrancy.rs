use tauri::WebviewWindow;

/// macOS: native NSVisualEffect (arka plan blur). Windows: Mica (destekleniyorsa).
#[cfg(target_os = "macos")]
pub fn apply_window_glass(window: &WebviewWindow) -> Result<(), String> {
    use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
    apply_vibrancy(
        window,
        NSVisualEffectMaterial::UnderWindowBackground,
        None,
        None,
    )
    .map_err(|e| format!("Vibrancy uygulanamadı: {e}"))
}

#[cfg(target_os = "windows")]
pub fn apply_window_glass(window: &WebviewWindow) -> Result<(), String> {
    use window_vibrancy::apply_mica;
    if apply_mica(window, None).is_ok() {
        return Ok(());
    }
    Ok(())
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn apply_window_glass(_window: &WebviewWindow) -> Result<(), String> {
    Ok(())
}
