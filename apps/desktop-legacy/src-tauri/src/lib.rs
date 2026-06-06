#![allow(non_snake_case)]

mod commands;
mod db;
mod error;
mod remote_connect;
mod remote_pool;
mod session;
mod ssh_auth;
mod sync;
mod tray;
mod tray_i18n;
mod vault;
mod vibrancy;

#[cfg(target_os = "macos")]
mod macos_titlebar;

use commands::{
    app_info, close_session, hosts_delete, hosts_list, hosts_save, keys_delete, keys_generate,
    tray_set_locale,
    keys_list, keys_save, local_home_dir, local_list_dir,
    remote_download_host, remote_list_dir, remote_list_dir_host, remote_test_connection,
    remote_test_connection_host, remote_upload_host,
    show_main_window, snippets_delete, snippets_list, snippets_save, spawn_local_shell,
    spawn_ssh_shell, sync_delete, sync_pull, sync_push, sync_status,
    terminal_resize, terminal_write, vault_forget_keychain, vault_lock,
    vault_setup, vault_status, vault_try_biometric_unlock, vault_try_keychain_unlock,
    vault_unlock,
};
use db::Database;
use remote_pool::RemoteFsPool;
use session::types::{TerminalResizePayload, TerminalWritePayload};
use session::SessionManager;
use tauri::{Listener, Manager, RunEvent, WindowEvent};
use vault::Vault;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
            let path = data_dir.join("termsh.db");
            let legacy_path = data_dir.join("signum.db");
            if !path.exists() && legacy_path.exists() {
                let _ = std::fs::rename(&legacy_path, &path);
            }
            let database = Database::open(&path)?;
            let _ = database.seed_default_snippets();
            app.manage(database);
            app.manage(Vault::default());
            app.manage(SessionManager::default());
            app.manage(RemoteFsPool::default());

            let write_listener = app.handle().clone();
            let write_app = write_listener.clone();
            write_listener.listen("terminal-write", move |event| {
                let Ok(payload) = serde_json::from_str::<TerminalWritePayload>(event.payload())
                else {
                    return;
                };
                if let Some(manager) = write_app.try_state::<SessionManager>() {
                    let _ = manager.write(&payload.session_id, &payload.data);
                }
            });
            let resize_listener = app.handle().clone();
            let resize_app = resize_listener.clone();
            resize_listener.listen("terminal-resize", move |event| {
                let Ok(payload) = serde_json::from_str::<TerminalResizePayload>(event.payload())
                else {
                    return;
                };
                if let Some(manager) = resize_app.try_state::<SessionManager>() {
                    let _ = manager.resize(
                        &payload.session_id,
                        payload.cols.max(2),
                        payload.rows.max(2),
                    );
                }
            });

            #[cfg(desktop)]
            tray::setup(app)?;

            if let Some(main) = app.get_webview_window("main") {
                let _ = vibrancy::apply_window_glass(&main);

                #[cfg(target_os = "macos")]
                {
                    let apply_lights = |w: &tauri::WebviewWindow| {
                        let _ = macos_titlebar::align_traffic_lights(w);
                    };
                    apply_lights(&main);

                    let main_resize = main.clone();
                    main.on_window_event(move |event| {
                        if matches!(
                            event,
                            WindowEvent::Resized(_)
                                | WindowEvent::ThemeChanged(_)
                                | WindowEvent::Focused(true)
                        ) {
                            let _ = macos_titlebar::align_traffic_lights(&main_resize);
                        }
                    });
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            spawn_local_shell,
            spawn_ssh_shell,
            terminal_write,
            terminal_resize,
            close_session,
            app_info,
            tray_set_locale,
            vault_status,
            vault_setup,
            vault_unlock,
            vault_try_keychain_unlock,
            vault_try_biometric_unlock,
            vault_forget_keychain,
            vault_lock,
            hosts_list,
            hosts_save,
            hosts_delete,
            snippets_list,
            snippets_save,
            snippets_delete,
            keys_list,
            keys_save,
            keys_generate,
            keys_delete,
            remote_test_connection,
            remote_list_dir,
            remote_test_connection_host,
            remote_list_dir_host,
            remote_download_host,
            remote_upload_host,
            local_home_dir,
            local_list_dir,
            show_main_window,
            sync_pull,
            sync_push,
            sync_status,
            sync_delete,
        ])
        .build(tauri::generate_context!())
        .expect("error while building termsh")
        .run(|app, event| {
            if let RunEvent::Ready = event {
                #[cfg(target_os = "macos")]
                if let Some(main) = app.get_webview_window("main") {
                    let _ = macos_titlebar::align_traffic_lights(&main);
                    let main_retry = main.clone();
                    let _ = main.run_on_main_thread(move || {
                        let _ = macos_titlebar::align_traffic_lights(&main_retry);
                    });
                }
            }
        });
}
