use crate::db::Database;
use crate::error::AppError;
use crate::sync::client::{delete_item, pull_items, push_item, whoami, SyncServerConfig};
use crate::sync::crypto::{decrypt_blob, encrypt_payload, SyncPayload};
use crate::vault::Vault;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncConfigPayload {
    pub api_url: String,
    pub access_token: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncStatusResponse {
    pub connected: bool,
    pub email: Option<String>,
    pub last_synced_at: Option<String>,
    pub pending_changes: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncEventPayload {
    pub added: u32,
    pub updated: u32,
}

#[tauri::command]
pub async fn sync_pull(
    config: SyncConfigPayload,
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<SyncEventPayload, AppError> {
    let server = SyncServerConfig {
        api_url: config.api_url,
        access_token: config.access_token,
    };

    let last = db.get_sync_meta("last_synced_at").unwrap_or_default();
    let since = if last.is_empty() { None } else { Some(last.as_str()) };
    let blobs = pull_items(&server, since, None).await?;

    let mut added = 0u32;
    let mut updated = 0u32;

    for blob in &blobs {
        let payload = decrypt_blob(&vault, blob)?;
        let version_key = format!("version_{}_{}", payload.item_type, payload.item_ref);
        let current_version: u32 = db
            .get_sync_meta(&version_key)
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(0);

        if current_version >= payload.version {
            continue;
        }

        match payload.item_type.as_str() {
            "host" => apply_host_sync(&db, &payload)?,
            "snippet" => apply_snippet_sync(&db, &payload)?,
            "ssh_key" => apply_key_sync(&db, &payload)?,
            _ => {}
        }

        let _ = db.set_sync_meta(&version_key, &payload.version.to_string());

        if current_version == 0 {
            added += 1;
        } else {
            updated += 1;
        }
    }

    if !blobs.is_empty() {
        if let Some(latest) = blobs.iter().filter_map(|b| Some(b.updated_at.as_str())).max() {
            let _ = db.set_sync_meta("last_synced_at", latest);
        }
    }

    Ok(SyncEventPayload { added, updated })
}

#[tauri::command]
pub async fn sync_push(
    config: SyncConfigPayload,
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<SyncEventPayload, AppError> {
    let server = SyncServerConfig {
        api_url: config.api_url,
        access_token: config.access_token,
    };

    let mut pushed = 0u32;

    let hosts = db.list_hosts().map_err(AppError::database)?;
    for host in &hosts {
        let payload = SyncPayload {
            item_type: "host".to_string(),
            item_ref: host.id.clone(),
            data: serde_json::to_string(host).map_err(|e| AppError::unknown(e.to_string()))?,
            version: 1,
        };
        let blob = encrypt_payload(&vault, &payload)?;
        push_item(&server, &blob).await?;
        pushed += 1;
    }

    let snippets = db.list_snippets().map_err(AppError::database)?;
    for snip in &snippets {
        let payload = SyncPayload {
            item_type: "snippet".to_string(),
            item_ref: snip.id.clone(),
            data: serde_json::to_string(snip).map_err(|e| AppError::unknown(e.to_string()))?,
            version: 1,
        };
        let blob = encrypt_payload(&vault, &payload)?;
        push_item(&server, &blob).await?;
        pushed += 1;
    }

    let keys = db.list_ssh_keys().map_err(AppError::database)?;
    for key in &keys {
        let payload = SyncPayload {
            item_type: "ssh_key".to_string(),
            item_ref: key.id.clone(),
            data: serde_json::to_string(key).map_err(|e| AppError::unknown(e.to_string()))?,
            version: 1,
        };
        let blob = encrypt_payload(&vault, &payload)?;
        push_item(&server, &blob).await?;
        pushed += 1;
    }

    Ok(SyncEventPayload { added: 0, updated: pushed })
}

#[tauri::command]
pub async fn sync_status(
    config: SyncConfigPayload,
    db: State<'_, Database>,
) -> Result<SyncStatusResponse, AppError> {
    let server = SyncServerConfig {
        api_url: config.api_url.clone(),
        access_token: config.access_token.clone(),
    };

    let connected = match whoami(&server).await {
        Ok(user) => SyncStatusResponse {
            connected: true,
            email: Some(user.email),
            last_synced_at: db.get_sync_meta("last_synced_at").ok(),
            pending_changes: 0,
        },
        Err(_) => SyncStatusResponse {
            connected: false,
            email: None,
            last_synced_at: db.get_sync_meta("last_synced_at").ok(),
            pending_changes: 0,
        },
    };

    Ok(connected)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncDeletePayload {
    pub api_url: String,
    pub access_token: String,
    pub item_type: String,
    pub item_ref: String,
}

#[tauri::command]
pub async fn sync_delete(
    payload: SyncDeletePayload,
) -> Result<(), AppError> {
    let server = SyncServerConfig {
        api_url: payload.api_url,
        access_token: payload.access_token,
    };
    delete_item(&server, &payload.item_ref).await
}

fn apply_host_sync(db: &Database, payload: &SyncPayload) -> Result<(), AppError> {
    let host: crate::db::HostRecord =
        serde_json::from_str(&payload.data).map_err(|e| AppError::sync_parse_failed(e.to_string()))?;
    db.upsert_host(&host).map_err(AppError::database)
}

fn apply_snippet_sync(db: &Database, payload: &SyncPayload) -> Result<(), AppError> {
    let snip: crate::db::SnippetRecord =
        serde_json::from_str(&payload.data).map_err(|e| AppError::sync_parse_failed(e.to_string()))?;
    db.upsert_snippet(&snip).map_err(AppError::database)
}

fn apply_key_sync(db: &Database, payload: &SyncPayload) -> Result<(), AppError> {
    let key: crate::db::SshKeyRecord =
        serde_json::from_str(&payload.data).map_err(|e| AppError::sync_parse_failed(e.to_string()))?;
    db.upsert_ssh_key(&key).map_err(AppError::database)
}
