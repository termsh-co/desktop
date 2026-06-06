use std::sync::Mutex;

use zeroize::{Zeroize, ZeroizeOnDrop};

use crate::db::Database;
use crate::error::{CoreError, CoreResult};
use crate::models::{Host, Snippet, SshKey};
use crate::vault::payload::{load_bundle, migrate_plaintext_to_bundle, save_bundle, VaultBundle};
use crate::vault::{check_verifier, make_verifier, derive_master_key, random_salt};

#[derive(Zeroize, ZeroizeOnDrop)]
struct MasterKey([u8; 32]);

pub struct VaultRuntime {
    inner: Mutex<VaultInner>,
}

struct VaultInner {
    master_key: Option<MasterKey>,
    bundle: Option<VaultBundle>,
}

impl Default for VaultRuntime {
    fn default() -> Self {
        Self {
            inner: Mutex::new(VaultInner {
                master_key: None,
                bundle: None,
            }),
        }
    }
}

impl VaultRuntime {
    pub fn is_unlocked(&self) -> bool {
        self.inner
            .lock()
            .map(|state| state.master_key.is_some())
            .unwrap_or(false)
    }

    pub fn lock(&self) {
        if let Ok(mut state) = self.inner.lock() {
            state.master_key = None;
            state.bundle = None;
        }
    }

    pub fn setup(&self, db: &Database, password: &str) -> CoreResult<()> {
        if db.is_vault_setup()? {
            return Err(CoreError::VaultAlreadySetup);
        }
        if password.len() < 8 {
            return Err(CoreError::VaultPasswordTooShort);
        }

        let salt = random_salt();
        let key = derive_master_key(password, &salt)?;
        let verifier = make_verifier(&key)?;
        db.save_vault_meta(&salt, &verifier)?;
        let bundle = VaultBundle::default();
        save_bundle(db, &key, &bundle)?;
        self.set_unlocked(key, bundle)
    }

    pub fn unlock(&self, db: &Database, password: &str) -> CoreResult<()> {
        let Some((salt, verifier)) = db.load_vault_meta()? else {
            return Err(CoreError::VaultNotSetup);
        };
        let key = derive_master_key(password, &salt)?;
        if !check_verifier(&key, &verifier) {
            return Err(CoreError::VaultWrongPassword);
        }
        migrate_plaintext_to_bundle(db, &key)?;
        let bundle = load_bundle(db, &key)?;
        self.set_unlocked(key, bundle)
    }

    pub fn persist(&self, db: &Database) -> CoreResult<()> {
        let mut state = self
            .inner
            .lock()
            .map_err(|e| CoreError::Internal(e.to_string()))?;
        let key = state
            .master_key
            .as_ref()
            .map(|mk| mk.0)
            .ok_or(CoreError::VaultLocked)?;
        let bundle = state
            .bundle
            .as_ref()
            .ok_or(CoreError::VaultLocked)?
            .clone();
        drop(state);
        save_bundle(db, &key, &bundle)
    }

    pub fn list_hosts(&self) -> CoreResult<Vec<Host>> {
        self.with_bundle(|b| Ok(b.hosts.clone()))
    }

    pub fn upsert_host(&self, db: &Database, host: Host) -> CoreResult<()> {
        self.with_bundle_mut(|b| {
            if let Some(idx) = b.hosts.iter().position(|h| h.id == host.id) {
                b.hosts[idx] = host;
            } else {
                b.hosts.push(host);
            }
        })?;
        self.persist(db)
    }

    pub fn list_snippets(&self) -> CoreResult<Vec<Snippet>> {
        self.with_bundle(|b| Ok(b.snippets.clone()))
    }

    pub fn upsert_snippet(&self, db: &Database, snippet: Snippet) -> CoreResult<()> {
        self.with_bundle_mut(|b| {
            if let Some(idx) = b.snippets.iter().position(|s| s.id == snippet.id) {
                b.snippets[idx] = snippet;
            } else {
                b.snippets.push(snippet);
            }
        })?;
        self.persist(db)
    }

    pub fn list_ssh_keys(&self) -> CoreResult<Vec<SshKey>> {
        self.with_bundle(|b| Ok(b.ssh_keys.clone()))
    }

    pub fn store_secret(&self, db: &Database, ref_id: &str, secret: &str) -> CoreResult<()> {
        self.with_bundle_mut(|b| {
            b.secrets.insert(ref_id.to_string(), secret.to_string());
        })?;
        self.persist(db)
    }

    pub fn load_secret(&self, ref_id: &str) -> CoreResult<String> {
        self.with_bundle(|b| {
            b.secrets
                .get(ref_id)
                .cloned()
                .ok_or(CoreError::CredentialNotFound)
        })
    }

    pub fn delete_secret(&self, db: &Database, ref_id: &str) -> CoreResult<()> {
        self.with_bundle_mut(|b| {
            b.secrets.remove(ref_id);
        })?;
        self.persist(db)
    }

    fn set_unlocked(&self, key: [u8; 32], bundle: VaultBundle) -> CoreResult<()> {
        let mut state = self
            .inner
            .lock()
            .map_err(|e| CoreError::Internal(e.to_string()))?;
        state.master_key = Some(MasterKey(key));
        state.bundle = Some(bundle);
        Ok(())
    }

    fn with_bundle<F, T>(&self, f: F) -> CoreResult<T>
    where
        F: FnOnce(&VaultBundle) -> CoreResult<T>,
    {
        let state = self
            .inner
            .lock()
            .map_err(|e| CoreError::Internal(e.to_string()))?;
        if state.master_key.is_none() {
            return Err(CoreError::VaultLocked);
        }
        let bundle = state.bundle.as_ref().ok_or(CoreError::VaultLocked)?;
        f(bundle)
    }

    fn with_bundle_mut<F>(&self, f: F) -> CoreResult<()>
    where
        F: FnOnce(&mut VaultBundle),
    {
        let mut state = self
            .inner
            .lock()
            .map_err(|e| CoreError::Internal(e.to_string()))?;
        if state.master_key.is_none() {
            return Err(CoreError::VaultLocked);
        }
        let bundle = state.bundle.as_mut().ok_or(CoreError::VaultLocked)?;
        f(bundle);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::Database;
    use crate::models::Host;

    fn sample_host(id: &str) -> Host {
        Host {
            id: id.into(),
            name: "Prod".into(),
            hostname: "example.com".into(),
            port: 22,
            username: "deploy".into(),
            auth_type: "password".into(),
            credential_ref: Some("cred-1".into()),
            private_key_ref: None,
            tags: vec![],
            group: None,
            color: None,
            platform: None,
            last_connected_at: None,
        }
    }

    #[test]
    fn encrypted_bundle_roundtrip() {
        let db = Database::open_in_memory().expect("db");
        let vault = VaultRuntime::default();
        vault.setup(&db, "test-password-123").expect("setup");
        vault
            .store_secret(&db, "cred-1", "hunter2")
            .expect("secret");
        vault
            .upsert_host(&db, sample_host("h1"))
            .expect("host");
        vault.lock();
        vault.unlock(&db, "test-password-123").expect("unlock");
        let hosts = vault.list_hosts().expect("hosts");
        assert_eq!(hosts.len(), 1);
        assert_eq!(hosts[0].hostname, "example.com");
        assert_eq!(vault.load_secret("cred-1").expect("secret"), "hunter2");
        assert!(db.list_hosts().expect("legacy").is_empty());
    }
}
