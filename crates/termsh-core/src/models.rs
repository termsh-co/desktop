use serde::{Deserialize, Serialize};

/// Shared host record — matches SQLite schema across platforms.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Host {
    pub id: String,
    pub name: String,
    pub hostname: String,
    pub port: u16,
    pub username: String,
    pub auth_type: String,
    pub credential_ref: Option<String>,
    pub private_key_ref: Option<String>,
    pub tags: Vec<String>,
    pub group: Option<String>,
    pub color: Option<String>,
    pub platform: Option<String>,
    pub last_connected_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Snippet {
    pub id: String,
    pub title: String,
    pub body: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SshKey {
    pub id: String,
    pub name: String,
    pub ref_id: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum BiometricKind {
    None,
    TouchId,
    FaceId,
    WindowsHello,
    Generic,
}
