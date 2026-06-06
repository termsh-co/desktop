use crate::error::{AppError, AppResult};
use crate::sync::crypto::SyncBlob;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncServerConfig {
    pub api_url: String,
    pub access_token: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UserResponse {
    pub email: String,
}

pub async fn pull_items(
    config: &SyncServerConfig,
    since: Option<&str>,
    _item_type: Option<&str>,
) -> AppResult<Vec<SyncBlob>> {
    let client = reqwest::Client::new();
    let mut url = format!("{}/sync/blobs", config.api_url);

    if let Some(s) = since {
        url = format!("{}?since={}", url, s);
    }

    let resp = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", config.access_token))
        .send()
        .await
        .map_err(|e| AppError::sync_request_failed(e.to_string()))?;

    let status = resp.status();
    if !status.is_success() {
        let body = resp.text().await.unwrap_or_default();
        return Err(AppError::sync_http_error(status.as_u16(), body));
    }

    let items: Vec<SyncBlob> = resp
        .json()
        .await
        .map_err(|e| AppError::sync_parse_failed(e.to_string()))?;
    Ok(items)
}

pub async fn push_item(config: &SyncServerConfig, blob: &SyncBlob) -> AppResult<SyncBlob> {
    let client = reqwest::Client::new();

    #[derive(Serialize)]
    #[serde(rename_all = "camelCase")]
    struct PushBody {
        record_id: String,
        encrypted_blob: String,
        version: u32,
    }

    let body = PushBody {
        record_id: blob.record_id.clone(),
        encrypted_blob: blob.encrypted_blob.clone(),
        version: blob.version,
    };

    let resp = client
        .post(format!("{}/sync/blobs", config.api_url))
        .header("Authorization", format!("Bearer {}", config.access_token))
        .json(&body)
        .send()
        .await
        .map_err(|e| AppError::sync_request_failed(e.to_string()))?;

    let status = resp.status();
    if !status.is_success() {
        let body_text = resp.text().await.unwrap_or_default();
        return Err(AppError::sync_http_error(status.as_u16(), body_text));
    }

    let item: SyncBlob = resp
        .json()
        .await
        .map_err(|e| AppError::sync_parse_failed(e.to_string()))?;
    Ok(item)
}

#[allow(dead_code)]
pub async fn delete_item(config: &SyncServerConfig, record_id: &str) -> AppResult<()> {
    let client = reqwest::Client::new();
    let url = format!("{}/sync/blobs/{}", config.api_url, record_id);

    let resp = client
        .delete(&url)
        .header("Authorization", format!("Bearer {}", config.access_token))
        .send()
        .await
        .map_err(|e| AppError::sync_request_failed(e.to_string()))?;

    let status = resp.status();
    if !status.is_success() {
        let body = resp.text().await.unwrap_or_default();
        return Err(AppError::sync_http_error(status.as_u16(), body));
    }

    Ok(())
}

pub async fn whoami(config: &SyncServerConfig) -> AppResult<UserResponse> {
    let client = reqwest::Client::new();
    let resp = client
        .get(format!("{}/auth/me", config.api_url))
        .header("Authorization", format!("Bearer {}", config.access_token))
        .send()
        .await
        .map_err(|e| AppError::sync_request_failed(e.to_string()))?;

    if !resp.status().is_success() {
        return Err(AppError::sync_auth_invalid_token());
    }

    resp.json()
        .await
        .map_err(|e| AppError::sync_parse_failed(e.to_string()))
}
