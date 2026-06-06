use crate::db::Database;
use crate::error::{AppError, AppResult};

use super::Vault;

/// Host listesi / yerel kullanım: kasa yoksa veya açıksa izin ver.
pub fn allow_host_read(db: &Database, vault: &Vault) -> AppResult<()> {
    if db.is_vault_setup().map_err(AppError::database)? && !vault.is_unlocked() {
        return Err(AppError::vault_locked());
    }
    Ok(())
}

/// Kimlik bilgisi yazmadan önce kasanın kurulu ve açık olması gerekir.
pub fn require_vault_for_secrets(db: &Database, vault: &Vault) -> AppResult<()> {
    if !db.is_vault_setup().map_err(AppError::database)? {
        return Err(AppError::vault_not_setup_for_secrets());
    }
    if !vault.is_unlocked() {
        return Err(AppError::vault_locked_for_secrets());
    }
    Ok(())
}

/// Kayıtlı sır ile SSH: kasa kurulu ve açık olmalı.
pub fn require_vault_for_ssh_secrets(db: &Database, vault: &Vault) -> AppResult<()> {
    require_vault_for_secrets(db, vault)
}
