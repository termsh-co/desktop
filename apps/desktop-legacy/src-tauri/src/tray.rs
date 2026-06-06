use std::path::PathBuf;

use crate::tray_i18n;

use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    App, AppHandle, Emitter, Manager, Runtime,
};

const TRAY_ID: &str = "termsh-tray";
const MAIN_LABEL: &str = "main";

fn tray_icon_image() -> tauri::Result<Image<'static>> {
    let icons = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("icons");
    #[cfg(target_os = "macos")]
    let path = icons.join("tray-icon@2x.png");
    #[cfg(not(target_os = "macos"))]
    let path = icons.join("32x32.png");
    Image::from_path(path)
}

fn build_menu<R: Runtime>(app: &AppHandle<R>, locale: &str) -> tauri::Result<Menu<R>> {
    let labels = tray_i18n::labels(locale);
    let show = MenuItem::with_id(app, "tray-show", labels.show, true, None::<&str>)?;
    let local = MenuItem::with_id(app, "tray-local", labels.open_terminal, true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "tray-quit", labels.quit, true, None::<&str>)?;
    Menu::with_items(app, &[&show, &local, &sep, &quit])
}

pub fn setup(app: &App) -> tauri::Result<()> {
    let menu = build_menu(&app.handle(), "en")?;
    let icon = tray_icon_image()?;
    let labels = tray_i18n::labels("en");

    let mut builder = TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .menu(&menu)
        .tooltip(labels.tooltip);

    #[cfg(target_os = "macos")]
    {
        builder = builder.icon_as_template(true).show_menu_on_left_click(true);
    }

    let _tray = builder
        .on_menu_event(|app, event| match event.id().as_ref() {
            "tray-show" => show_main_window(app),
            "tray-local" => {
                let _ = app.emit("tray-open-local", ());
                show_main_window(app);
            }
            "tray-quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::DoubleClick { .. } = event {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

pub fn set_locale<R: Runtime>(app: &AppHandle<R>, locale: &str) -> tauri::Result<()> {
    let menu = build_menu(app, locale)?;
    let labels = tray_i18n::labels(locale);
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        tray.set_menu(Some(menu))?;
        tray.set_tooltip(Some(labels.tooltip))?;
    }
    Ok(())
}

pub fn show_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(main) = app.get_webview_window(MAIN_LABEL) {
        let _ = main.show();
        let _ = main.unminimize();
        let _ = main.set_focus();
    }
}
