//! macOS traffic light — `--termsh-header-height` bandında nav pill ile aynı dikey orta.

use objc2_app_kit::{NSWindow, NSWindowButton};
use objc2_foundation::MainThreadMarker;
use std::ptr::NonNull;
use tauri::WebviewWindow;

/// `tokens.css` → `--termsh-header-height`
pub const HEADER_BAND_HEIGHT: f64 = 52.0;
pub const TRAFFIC_LIGHT_X: f64 = 14.0;

pub fn align_traffic_lights(window: &WebviewWindow) -> Result<(), String> {
    MainThreadMarker::new().ok_or_else(|| "traffic lights: main thread required".to_string())?;

    let ns_ptr = window.ns_window().map_err(|e| e.to_string())?;
    let Some(ns_ptr) = NonNull::new(ns_ptr) else {
        return Ok(());
    };

    unsafe {
        inset_traffic_lights(ns_ptr.cast().as_ref(), TRAFFIC_LIGHT_X);
    }
    Ok(())
}

/// wry `inset_traffic_lights` + butonları bant içinde dikey ortala.
unsafe fn inset_traffic_lights(window: &NSWindow, x: f64) {
    let Some(close) = window.standardWindowButton(NSWindowButton::CloseButton) else {
        return;
    };
    let Some(miniaturize) = window.standardWindowButton(NSWindowButton::MiniaturizeButton) else {
        return;
    };
    let zoom = window.standardWindowButton(NSWindowButton::ZoomButton);

    let Some(close_super) = close.superview() else {
        return;
    };
    let Some(title_bar_container_view) = close_super.superview() else {
        return;
    };

    let close_rect = close.frame();
    let btn_h = close_rect.size.height;
    let y_inset = (HEADER_BAND_HEIGHT - btn_h).max(0.0);

    let title_bar_frame_height = btn_h + y_inset;
    let mut title_bar_rect = title_bar_container_view.frame();
    title_bar_rect.size.height = title_bar_frame_height;
    title_bar_rect.origin.y = window.frame().size.height - title_bar_frame_height;
    title_bar_container_view.setFrame(title_bar_rect);

    let centered_y = y_inset / 2.0;
    let space_between = miniaturize.frame().origin.x - close_rect.origin.x;

    let mut window_buttons = vec![close, miniaturize];
    if let Some(zoom) = zoom {
        window_buttons.push(zoom);
    }

    for (i, button) in window_buttons.into_iter().enumerate() {
        let mut rect = button.frame();
        rect.origin.x = x + (i as f64 * space_between);
        rect.origin.y = centered_y;
        button.setFrame(rect);
    }
}
