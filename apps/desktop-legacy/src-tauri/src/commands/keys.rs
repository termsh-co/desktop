#[path = "keys_generate.rs"]
mod keys_generate;

use crate::db::{Database, SshKeyRecord};
use crate::error::{AppError, AppResult};
use crate::vault::access::{allow_host_read, require_vault_for_secrets};
use crate::vault::Vault;
use keys_generate::generate_ssh_key_pair;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateKeyPayload {
    pub name: String,
    /// `ed25519` or `rsa`
    pub algorithm: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateKeyResult {
    pub key: SshKeyRecord,
    pub public_key_pem: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveKeyPayload {
    pub id: Option<String>,
    pub name: String,
    pub privateKeyPem: Option<String>,
    pub tags: Vec<String>,
}

#[tauri::command]
pub fn keys_list(
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<Vec<SshKeyRecord>, AppError> {
    allow_host_read(&db, &vault)?;
    db.list_ssh_keys().map_err(AppError::database)
}

fn save_ssh_key(
    db: &Database,
    vault: &Vault,
    payload: SaveKeyPayload,
) -> AppResult<SshKeyRecord> {
    let id = payload
        .id
        .clone()
        .unwrap_or_else(|| Uuid::new_v4().to_string());

    if payload.name.trim().is_empty() {
        return Err(AppError::key_name_required());
    }

    let existing = payload.id.as_ref().and_then(|key_id| {
        db.list_ssh_keys()
            .ok()
            .and_then(|all| all.into_iter().find(|k| k.id == *key_id))
    });

    let ref_id = existing
        .as_ref()
        .map(|k| k.ref_id.clone())
        .unwrap_or_else(|| format!("key-global-{id}"));

    if let Some(pem) = payload
        .privateKeyPem
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    {
        if !pem.contains("PRIVATE KEY") {
            return Err(AppError::key_pem_invalid());
        }
        vault.store_secret(db, &ref_id, pem)?;
    } else if existing.is_none() {
        return Err(AppError::key_private_required());
    }

    let record = SshKeyRecord {
        id: id.clone(),
        name: payload.name.trim().to_string(),
        ref_id,
        tags: payload.tags,
        created_at: None,
        updated_at: None,
    };
    db.upsert_ssh_key(&record).map_err(AppError::database)?;
    db.list_ssh_keys()
        .map_err(AppError::database)?
        .into_iter()
        .find(|k| k.id == id)
        .ok_or_else(AppError::key_not_found)
}

#[tauri::command]
pub fn keys_save(
    payload: SaveKeyPayload,
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<SshKeyRecord, AppError> {
    allow_host_read(&db, &vault)?;
    require_vault_for_secrets(&db, &vault)?;
    save_ssh_key(&db, &vault, payload)
}

#[tauri::command]
pub fn keys_generate(
    payload: GenerateKeyPayload,
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<GenerateKeyResult, AppError> {
    allow_host_read(&db, &vault)?;
    require_vault_for_secrets(&db, &vault)?;

    if payload.name.trim().is_empty() {
        return Err(AppError::key_name_required());
    }

    let (private_pem, public_pem) = generate_ssh_key_pair(payload.algorithm.trim())?;

    let save = SaveKeyPayload {
        id: None,
        name: payload.name,
        privateKeyPem: Some(private_pem),
        tags: payload.tags,
    };

    let key = save_ssh_key(&db, &vault, save)?;
    Ok(GenerateKeyResult {
        key,
        public_key_pem: public_pem,
    })
}

#[tauri::command]
pub fn keys_delete(
    id: String,
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<(), AppError> {
    allow_host_read(&db, &vault)?;
    require_vault_for_secrets(&db, &vault)?;
    if let Some(ref_id) = db.delete_ssh_key(&id).map_err(AppError::database)? {
        vault.delete_secret(&db, &ref_id)?;
    }
    Ok(())
}
