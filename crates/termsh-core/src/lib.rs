//! Platform-agnostic termsh core library.
//!
//! Consumed by Swift (UniFFI), Kotlin (JNI), and legacy Tauri desktop during migration.

pub mod db;
pub mod error;
#[cfg(feature = "uniffi")]
pub mod ffi;
pub mod models;
pub mod vault;

pub const CORE_VERSION: &str = env!("CARGO_PKG_VERSION");

/// Exposed to Swift via UniFFI (`--features uniffi`).
pub fn core_version() -> String {
    CORE_VERSION.to_string()
}

#[cfg(feature = "uniffi")]
uniffi::setup_scaffolding!("termsh_core");
