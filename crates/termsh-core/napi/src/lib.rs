#![deny(clippy::all)]

use napi_derive::napi;
use termsh_core::CORE_VERSION;

#[napi]
pub fn core_version() -> String {
    CORE_VERSION.to_string()
}

#[napi]
pub fn vault_is_unlocked_placeholder() -> bool {
    false
}
