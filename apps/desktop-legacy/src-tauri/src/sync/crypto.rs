use crate::vault::Vault;
use crate::vault::crypto;
use base64::Engine as _;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncPayload {
    pub item_type: String,
    pub item_ref: String,
    pub data: String,
    pub version: u32,
}

/// Opaque sync envelope — metadata (item_type, item_ref, payload) inside encrypted_blob.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncBlob {
    pub record_id: String,
    pub encrypted_blob: String,
    pub version: u32,
    pub updated_at: String,
}

pub fn encrypt_payload(vault: &Vault, payload: &SyncPayload) -> Result<SyncBlob, String> {
    let key = vault.master_key_bytes()?;
    let plaintext = serde_json::to_vec(payload).map_err(|e| format!("JSON: {e}"))?;
    let encrypted = crypto::encrypt(&key, &plaintext)?;

    Ok(SyncBlob {
        record_id: payload.item_ref.clone(),
        encrypted_blob: base64::engine::general_purpose::STANDARD.encode(&encrypted),
        version: payload.version,
        updated_at: String::new(),
    })
}

pub fn decrypt_blob(vault: &Vault, blob: &SyncBlob) -> Result<SyncPayload, String> {
    let key = vault.master_key_bytes()?;
    let combined = base64::engine::general_purpose::STANDARD
        .decode(&blob.encrypted_blob)
        .map_err(|e| format!("blob decode: {e}"))?;

    let plaintext = crypto::decrypt(&key, &combined)?;
    let payload: SyncPayload =
        serde_json::from_slice(&plaintext).map_err(|e| format!("Deserialize: {e}"))?;
    Ok(payload)
}
