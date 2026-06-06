pub mod access;

pub mod crypto;
pub mod keychain;
pub mod keychain_biometric;

use crate::db::Database;
use crate::error::{AppError, AppResult};
use crypto::{check_verifier, decrypt, encrypt, make_verifier};
use std::collections::HashMap;
use std::sync::Mutex;
use termsh_core::vault::kdf::random_salt;
use zeroize::{Zeroize, ZeroizeOnDrop};

#[derive(Zeroize, ZeroizeOnDrop)]
struct MasterKey([u8; 32]);

pub struct Vault {
    inner: Mutex<VaultInner>,
}

struct VaultInner {
    master_key: Option<MasterKey>,
    /// Kilit açıkken çözülmüş sırlar — tekrarlayan SSH bağlantılarında DB+AES maliyetini düşürür.
    secret_cache: HashMap<String, String>,
}

impl Default for Vault {
    fn default() -> Self {
        Self {
            inner: Mutex::new(VaultInner {
                master_key: None,
                secret_cache: HashMap::new(),
            }),
        }
    }
}

impl Vault {
    pub fn is_unlocked(&self) -> bool {
        self.inner
            .lock()
            .map(|state| state.master_key.is_some())
            .unwrap_or(false)
    }

    pub fn lock(&self) {
        if let Ok(mut state) = self.inner.lock() {
            state.master_key = None;
            state.secret_cache.clear();
        }
    }

    pub fn setup(
        &self,
        db: &Database,
        password: &str,
        remember_in_keychain: bool,
        use_biometric: bool,
    ) -> AppResult<()> {
        if db.is_vault_setup().map_err(AppError::database)? {
            return Err(AppError::vault_already_setup());
        }
        if password.len() < 8 {
            return Err(AppError::vault_password_too_short());
        }

        let salt = random_salt();
        let key = derive_master_key(password, &salt)?;
        let verifier = make_verifier(&key)?;

        db.save_vault_meta(&salt, &verifier).map_err(AppError::database)?;
        self.set_master_key(key)?;
        self.sync_unlock_storage(&key, remember_in_keychain, use_biometric)?;
        Ok(())
    }

    pub fn unlock_with_password(
        &self,
        db: &Database,
        password: &str,
        remember_in_keychain: bool,
        use_biometric: bool,
    ) -> AppResult<()> {
        let Some((salt, verifier)) = db.load_vault_meta().map_err(AppError::database)? else {
            return Err(AppError::vault_setup_first());
        };
        let key = derive_master_key(password, &salt)?;
        if !check_verifier(&key, &verifier) {
            return Err(AppError::vault_wrong_password());
        }
        self.set_master_key(key)?;
        self.sync_unlock_storage(&key, remember_in_keychain, use_biometric)
    }

    /// Touch ID / Face ID korumalı anahtarlıktan aç.
    pub fn try_unlock_from_biometric(&self, db: &Database) -> AppResult<bool> {
        if !db.is_vault_setup().map_err(AppError::database)? || self.is_unlocked() {
            return Ok(false);
        }
        if !keychain_biometric::is_enabled() {
            return Ok(false);
        }
        let key = match keychain_biometric::load_master_key() {
            Ok(k) => k,
            Err(_) => return Ok(false),
        };
        match self.unlock_with_master_key(db, key) {
            Ok(()) => Ok(true),
            Err(_) => {
                let _ = keychain_biometric::clear_master_key();
                Ok(false)
            }
        }
    }

    /// Anahtarlıkta saklanan master key ile aç (açılışta otomatik).
    pub fn try_unlock_from_keychain(&self, db: &Database) -> AppResult<bool> {
        if !db.is_vault_setup().map_err(AppError::database)? || self.is_unlocked() {
            return Ok(false);
        }
        let key = match keychain::load_master_key() {
            Ok(k) => k,
            Err(_) => return Ok(false),
        };
        match self.unlock_with_master_key(db, key) {
            Ok(()) => Ok(true),
            Err(_) => {
                let _ = keychain::clear_master_key();
                Ok(false)
            }
        }
    }

    pub fn unlock_with_master_key(&self, db: &Database, key: [u8; 32]) -> AppResult<()> {
        let Some((_, verifier)) = db.load_vault_meta().map_err(AppError::database)? else {
            return Err(AppError::vault_setup_first());
        };
        if !check_verifier(&key, &verifier) {
            return Err(AppError::vault_invalid_key());
        }
        self.set_master_key(key)
    }

    fn sync_unlock_storage(
        &self,
        key: &[u8; 32],
        remember_in_keychain: bool,
        use_biometric: bool,
    ) -> AppResult<()> {
        if use_biometric && keychain_biometric::is_available() {
            let _ = keychain::clear_master_key();
            keychain_biometric::store_master_key(key)?;
            return Ok(());
        }

        let _ = keychain_biometric::clear_master_key();
        if remember_in_keychain && keychain::is_available() {
            keychain::store_master_key(key)?;
        } else {
            let _ = keychain::clear_master_key();
        }
        Ok(())
    }

    pub fn store_secret(&self, db: &Database, ref_id: &str, secret: &str) -> AppResult<()> {
        let key = self.master_key_bytes()?;
        let blob = encrypt(&key, secret.as_bytes())?;
        db.upsert_credential(ref_id, &blob).map_err(AppError::database)?;
        if let Ok(mut state) = self.inner.lock() {
            state
                .secret_cache
                .insert(ref_id.to_string(), secret.to_string());
        }
        Ok(())
    }

    pub fn load_secret(&self, db: &Database, ref_id: &str) -> AppResult<String> {
        if let Ok(state) = self.inner.lock() {
            if let Some(cached) = state.secret_cache.get(ref_id) {
                return Ok(cached.clone());
            }
        }
        let key = self.master_key_bytes()?;
        let blob = db
            .load_credential(ref_id)
            .map_err(AppError::database)?
            .ok_or_else(AppError::credential_not_found)?;
        let plain = decrypt(&key, &blob)?;
        let secret = String::from_utf8(plain).map_err(|_| AppError::credential_decode_failed())?;
        if let Ok(mut state) = self.inner.lock() {
            state
                .secret_cache
                .insert(ref_id.to_string(), secret.clone());
        }
        Ok(secret)
    }

    pub fn delete_secret(&self, db: &Database, ref_id: &str) -> AppResult<()> {
        db.delete_credential(ref_id).map_err(AppError::database)?;
        if let Ok(mut state) = self.inner.lock() {
            state.secret_cache.remove(ref_id);
        }
        Ok(())
    }

    fn set_master_key(&self, key: [u8; 32]) -> AppResult<()> {
        let mut state = self
            .inner
            .lock()
            .map_err(|e| AppError::unknown(e.to_string()))?;
        state.master_key = Some(MasterKey(key));
        state.secret_cache.clear();
        Ok(())
    }

    pub fn master_key_bytes(&self) -> AppResult<[u8; 32]> {
        let state = self
            .inner
            .lock()
            .map_err(|e| AppError::unknown(e.to_string()))?;
        state
            .master_key
            .as_ref()
            .map(|mk| mk.0)
            .ok_or_else(AppError::vault_locked)
    }
}

fn derive_master_key(password: &str, salt: &[u8]) -> AppResult<[u8; 32]> {
    termsh_core::vault::kdf::derive_master_key(password, salt)
        .map_err(|e| AppError::derive_key_failed(e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::Database;

    #[test]
    fn setup_unlock_lock_flow() {
        let db = Database::open_in_memory().expect("db");
        let vault = Vault::default();
        vault
            .setup(&db, "test-password-123", false, false)
            .expect("setup");
        assert!(vault.is_unlocked());
        vault.lock();
        assert!(!vault.is_unlocked());
        vault
            .unlock_with_password(&db, "test-password-123", false, false)
            .expect("unlock");
        assert!(vault.is_unlocked());
    }

    #[test]
    fn credential_store_requires_unlock() {
        let db = Database::open_in_memory().expect("db");
        let vault = Vault::default();
        let err = vault.store_secret(&db, "ref-1", "secret").unwrap_err();
        assert_eq!(err.code, "VAULT_LOCKED");
    }

    #[test]
    fn credential_roundtrip() {
        let db = Database::open_in_memory().expect("db");
        let vault = Vault::default();
        vault
            .setup(&db, "test-password-123", false, false)
            .expect("setup");
        vault.store_secret(&db, "cred-1", "hunter2").expect("store");
        vault.lock();
        vault
            .unlock_with_password(&db, "test-password-123", false, false)
            .expect("unlock");
        let value = vault.load_secret(&db, "cred-1").expect("load");
        assert_eq!(value, "hunter2");
    }
}
