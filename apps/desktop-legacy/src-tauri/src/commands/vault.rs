use crate::db::Database;
use crate::error::AppError;
use crate::vault::keychain;
use crate::vault::keychain_biometric::{self, BiometricKind};
use crate::vault::Vault;
use serde::Serialize;
use tauri::State;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultStatus {
    pub is_setup: bool,
    pub is_unlocked: bool,
    pub keychain_available: bool,
    pub keychain_enabled: bool,
    pub biometric_available: bool,
    pub biometric_enabled: bool,
    pub biometric_kind: BiometricKind,
}

#[tauri::command]
pub fn vault_status(
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<VaultStatus, AppError> {
    let biometric = keychain_biometric::status();
    Ok(VaultStatus {
        is_setup: db.is_vault_setup().map_err(AppError::database)?,
        is_unlocked: vault.is_unlocked(),
        keychain_available: keychain::is_available(),
        keychain_enabled: keychain::is_enabled(),
        biometric_available: biometric.available,
        biometric_enabled: biometric.enabled,
        biometric_kind: biometric.kind,
    })
}

#[tauri::command]
pub fn vault_setup(
    password: String,
    remember_in_keychain: Option<bool>,
    use_biometric: Option<bool>,
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<(), AppError> {
    vault.setup(
        &db,
        &password,
        remember_in_keychain.unwrap_or(false),
        use_biometric.unwrap_or(false),
    )
}

#[tauri::command]
pub fn vault_unlock(
    password: String,
    remember_in_keychain: Option<bool>,
    use_biometric: Option<bool>,
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<(), AppError> {
    vault.unlock_with_password(
        &db,
        &password,
        remember_in_keychain.unwrap_or(false),
        use_biometric.unwrap_or(false),
    )
}

#[tauri::command]
pub fn vault_try_keychain_unlock(
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<bool, AppError> {
    vault.try_unlock_from_keychain(&db)
}

#[tauri::command]
pub fn vault_try_biometric_unlock(
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<bool, AppError> {
    vault.try_unlock_from_biometric(&db)
}

#[tauri::command]
pub fn vault_forget_keychain() -> Result<(), AppError> {
    keychain::clear_all_stored_keys()
}

#[tauri::command]
pub fn vault_lock(vault: State<'_, Vault>) -> Result<(), AppError> {
    vault.lock();
    Ok(())
}
