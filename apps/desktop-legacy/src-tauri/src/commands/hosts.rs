use crate::db::{Database, HostRecord};
use crate::error::AppError;
use crate::vault::access::{allow_host_read, require_vault_for_secrets};
use crate::vault::Vault;
use serde::Deserialize;
use tauri::State;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveHostPayload {
    pub id: Option<String>,
    pub name: String,
    pub hostname: String,
    pub port: u16,
    pub username: String,
    pub authType: String,
    pub tags: Vec<String>,
    pub group: Option<String>,
    pub color: Option<String>,
    pub platform: Option<String>,
    pub sshKeyId: Option<String>,
    pub password: Option<String>,
    pub privateKey: Option<String>,
}

#[tauri::command]
pub fn hosts_list(
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<Vec<HostRecord>, AppError> {
    allow_host_read(&db, &vault)?;
    db.list_hosts().map_err(AppError::database)
}

#[tauri::command]
pub fn hosts_save(
    payload: SaveHostPayload,
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<HostRecord, AppError> {
    allow_host_read(&db, &vault)?;

    let id = payload
        .id
        .clone()
        .unwrap_or_else(|| Uuid::new_v4().to_string());
    let existing = payload
        .id
        .as_ref()
        .and_then(|host_id| db.get_host(host_id).ok().flatten());

    let mut credential_ref = existing.as_ref().and_then(|h| h.credential_ref.clone());
    let mut private_key_ref = existing.as_ref().and_then(|h| h.private_key_ref.clone());

    let new_password = payload
        .password
        .as_ref()
        .map(|p| !p.is_empty())
        .unwrap_or(false);
    let new_private_key = payload
        .privateKey
        .as_ref()
        .map(|k| !k.is_empty())
        .unwrap_or(false);

    if new_password || new_private_key {
        require_vault_for_secrets(&db, &vault)?;
    }

    if payload.authType == "password" {
        private_key_ref = None;
        if new_password {
            let pwd = payload.password.as_ref().unwrap().trim();
            if pwd.is_empty() {
                return Err(AppError::host_password_empty());
            }
            let ref_id = credential_ref
                .clone()
                .unwrap_or_else(|| format!("cred-{id}"));
            vault.store_secret(&db, &ref_id, pwd)?;
            credential_ref = Some(ref_id);
        }
    } else if payload.authType == "privateKey" {
        credential_ref = None;
        if let Some(key_id) = payload.sshKeyId.as_ref().filter(|s| !s.is_empty()) {
            require_vault_for_secrets(&db, &vault)?;
            let key = db
                .get_ssh_key(key_id)
                .map_err(AppError::database)?
                .ok_or_else(AppError::host_key_not_found)?;
            private_key_ref = Some(key.ref_id);
        } else if new_private_key {
            let key = payload.privateKey.as_ref().unwrap().trim();
            if key.is_empty() {
                return Err(AppError::host_private_key_empty());
            }
            let ref_id = private_key_ref
                .clone()
                .unwrap_or_else(|| format!("key-{id}"));
            vault.store_secret(&db, &ref_id, key)?;
            private_key_ref = Some(ref_id);
        }
    } else {
        return Err(AppError::host_invalid_auth_type());
    }

    let host = HostRecord {
        id: id.clone(),
        name: payload.name.trim().to_string(),
        hostname: payload.hostname.trim().to_string(),
        port: payload.port.max(1),
        username: payload.username.trim().to_string(),
        auth_type: payload.authType,
        credential_ref,
        private_key_ref,
        tags: payload.tags,
        group: payload.group,
        color: payload.color,
        platform: payload
            .platform
            .or_else(|| existing.as_ref().and_then(|h| h.platform.clone())),
        last_connected_at: existing.and_then(|h| h.last_connected_at),
    };

    db.upsert_host(&host).map_err(AppError::database)?;
    Ok(host)
}

#[tauri::command]
pub fn hosts_delete(
    id: String,
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<(), AppError> {
    allow_host_read(&db, &vault)?;

    if let Some((credential_ref, private_key_ref)) = db.delete_host(&id).map_err(AppError::database)? {
        let has_secrets = credential_ref.is_some() || private_key_ref.is_some();
        if has_secrets {
            require_vault_for_secrets(&db, &vault)?;
            if let Some(ref_id) = credential_ref {
                vault.delete_secret(&db, &ref_id)?;
            }
            if let Some(ref_id) = private_key_ref {
                vault.delete_secret(&db, &ref_id)?;
            }
        }
    }
    Ok(())
}
