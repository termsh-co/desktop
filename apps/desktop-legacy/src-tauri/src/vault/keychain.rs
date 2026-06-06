//! OS kasası (macOS Keychain, Windows Credential Manager, Linux Secret Service).

use base64::{engine::general_purpose::STANDARD, Engine};
use keyring::Entry;

use crate::error::{AppError, AppResult};

const SERVICE: &str = "app.termsh.desktop";
const LEGACY_SERVICE: &str = "app.signum.desktop";
const ACCOUNT: &str = "vault-master-key";

fn entry_for(service: &str) -> AppResult<Entry> {
    Entry::new(service, ACCOUNT).map_err(|e| {
        AppError::with_detail("KEYCHAIN_UNAVAILABLE", e.to_string())
    })
}

fn entry() -> AppResult<Entry> {
    entry_for(SERVICE)
}

fn legacy_entry() -> AppResult<Entry> {
    entry_for(LEGACY_SERVICE)
}

/// Platform anahtarlığı kullanılabilir mi (giriş oluşturulabiliyor mu).
pub fn is_available() -> bool {
    entry().is_ok()
}

/// Kayıtlı master key var mı.
pub fn is_enabled() -> bool {
    if let Ok(e) = entry() {
        if e.get_password().is_ok() {
            return true;
        }
    }
    legacy_entry()
        .map(|e| e.get_password().is_ok())
        .unwrap_or(false)
}

pub fn store_master_key(key: &[u8; 32]) -> AppResult<()> {
    let encoded = STANDARD.encode(key);
    entry()?
        .set_password(&encoded)
        .map_err(|e| AppError::keychain_write_failed(e.to_string()))
}

fn read_encoded_password() -> AppResult<String> {
    if let Ok(e) = entry() {
        if let Ok(value) = e.get_password() {
            return Ok(value);
        }
    }
    legacy_entry()?
        .get_password()
        .map_err(|e| AppError::keychain_read_failed(e.to_string()))
}

pub fn load_master_key() -> AppResult<[u8; 32]> {
    let encoded = read_encoded_password()?;
    let bytes = STANDARD
        .decode(encoded.trim())
        .map_err(|e| AppError::keychain_corrupt(e.to_string()))?;
    bytes
        .try_into()
        .map_err(|_| AppError::vault_invalid_key())
}

pub fn clear_master_key() -> AppResult<()> {
    match entry()?.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(AppError::keychain_delete_failed(e.to_string())),
    }
}

pub fn clear_all_stored_keys() -> AppResult<()> {
    let _ = clear_master_key();
    if let Ok(e) = legacy_entry() {
        let _ = e.delete_credential();
    }
    crate::vault::keychain_biometric::clear_master_key()
}
