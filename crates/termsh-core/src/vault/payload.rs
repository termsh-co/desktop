use serde::{Deserialize, Serialize};

use crate::db::Database;
use crate::error::{CoreError, CoreResult};
use crate::models::{Host, Snippet, SshKey};
use crate::vault::{decrypt, encrypt};

const VAULT_BUNDLE_ID: &str = "_bundle";

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct VaultBundle {
    pub hosts: Vec<Host>,
    pub snippets: Vec<Snippet>,
    pub ssh_keys: Vec<SshKey>,
    pub secrets: std::collections::HashMap<String, String>,
}

impl VaultBundle {
    pub fn from_db(db: &Database) -> CoreResult<Self> {
        Ok(Self {
            hosts: db.list_hosts()?,
            snippets: db.list_snippets()?,
            ssh_keys: db.list_ssh_keys()?,
            secrets: std::collections::HashMap::new(),
        })
    }
}

pub fn load_bundle(db: &Database, key: &[u8; 32]) -> CoreResult<VaultBundle> {
    let Some(blob) = db.load_vault_record(VAULT_BUNDLE_ID)? else {
        return Ok(VaultBundle::default());
    };
    let plain = decrypt(key, &blob)?;
    serde_json::from_slice(&plain).map_err(|_| CoreError::CryptoInvalidData)
}

pub fn save_bundle(db: &Database, key: &[u8; 32], bundle: &VaultBundle) -> CoreResult<()> {
    let plain = serde_json::to_vec(bundle).map_err(|e| CoreError::Internal(e.to_string()))?;
    let blob = encrypt(key, &plain)?;
    db.upsert_vault_record(VAULT_BUNDLE_ID, &blob)
}

pub fn migrate_plaintext_to_bundle(db: &Database, key: &[u8; 32]) -> CoreResult<()> {
    if db.load_vault_record(VAULT_BUNDLE_ID)?.is_some() {
        return Ok(());
    }
    let hosts = db.list_hosts()?;
    let snippets = db.list_snippets()?;
    let ssh_keys = db.list_ssh_keys()?;
    if hosts.is_empty() && snippets.is_empty() && ssh_keys.is_empty() {
        return Ok(());
    }

    let mut secrets = std::collections::HashMap::new();
    for host in &hosts {
        if let Some(ref_id) = &host.credential_ref {
            if let Some(blob) = db.load_credential(ref_id)? {
                if let Ok(plain) = decrypt(key, &blob) {
                    if let Ok(s) = String::from_utf8(plain) {
                        secrets.insert(ref_id.clone(), s);
                    }
                }
            }
        }
        if let Some(ref_id) = &host.private_key_ref {
            if let Some(blob) = db.load_credential(ref_id)? {
                if let Ok(plain) = decrypt(key, &blob) {
                    if let Ok(s) = String::from_utf8(plain) {
                        secrets.insert(ref_id.clone(), s);
                    }
                }
            }
        }
    }
    for key_row in &ssh_keys {
        if let Some(blob) = db.load_credential(&key_row.ref_id)? {
            if let Ok(plain) = decrypt(key, &blob) {
                if let Ok(s) = String::from_utf8(plain) {
                    secrets.insert(key_row.ref_id.clone(), s);
                }
            }
        }
    }

    let bundle = VaultBundle {
        hosts,
        snippets,
        ssh_keys,
        secrets,
    };
    save_bundle(db, key, &bundle)?;
    db.clear_plaintext_vault_data()?;
    Ok(())
}
