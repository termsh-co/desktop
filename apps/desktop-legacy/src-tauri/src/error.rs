use serde::Serialize;
use serde_json::{json, Value};
use std::fmt;

/// Structured error returned to the frontend for i18n via `errors` namespace.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppError {
    pub code: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

impl AppError {
    pub fn new(code: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            params: None,
            detail: None,
        }
    }

    pub fn with_detail(code: impl Into<String>, detail: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            params: None,
            detail: Some(detail.into()),
        }
    }

    pub fn with_params(code: impl Into<String>, params: Value) -> Self {
        Self {
            code: code.into(),
            params: Some(params),
            detail: None,
        }
    }

    pub fn unknown(detail: impl Into<String>) -> Self {
        Self::with_detail("UNKNOWN", detail)
    }

    pub fn database(detail: impl Into<String>) -> Self {
        Self::with_detail("DATABASE_ERROR", detail)
    }

    // Vault
    pub fn vault_locked() -> Self {
        Self::new("VAULT_LOCKED")
    }

    pub fn vault_not_setup_for_secrets() -> Self {
        Self::new("VAULT_NOT_SETUP_FOR_SECRETS")
    }

    pub fn vault_locked_for_secrets() -> Self {
        Self::new("VAULT_LOCKED_FOR_SECRETS")
    }

    pub fn vault_already_setup() -> Self {
        Self::new("VAULT_ALREADY_SETUP")
    }

    pub fn vault_password_too_short() -> Self {
        Self::new("VAULT_PASSWORD_TOO_SHORT")
    }

    pub fn vault_setup_first() -> Self {
        Self::new("VAULT_SETUP_FIRST")
    }

    pub fn vault_wrong_password() -> Self {
        Self::new("VAULT_WRONG_PASSWORD")
    }

    pub fn vault_invalid_key() -> Self {
        Self::new("VAULT_INVALID_KEY")
    }

    pub fn keychain_unavailable() -> Self {
        Self::new("KEYCHAIN_UNAVAILABLE")
    }

    pub fn keychain_write_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("KEYCHAIN_WRITE_FAILED", detail)
    }

    pub fn keychain_read_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("KEYCHAIN_READ_FAILED", detail)
    }

    pub fn keychain_corrupt(detail: impl Into<String>) -> Self {
        Self::with_detail("KEYCHAIN_CORRUPT", detail)
    }

    pub fn keychain_delete_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("KEYCHAIN_DELETE_FAILED", detail)
    }

    pub fn biometric_unavailable() -> Self {
        Self::new("BIOMETRIC_UNAVAILABLE")
    }

    pub fn biometric_unlock_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("BIOMETRIC_UNLOCK_FAILED", detail)
    }

    pub fn crypto_encrypt_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("CRYPTO_ENCRYPT_FAILED", detail)
    }

    pub fn crypto_invalid_data() -> Self {
        Self::new("CRYPTO_INVALID_DATA")
    }

    pub fn crypto_decrypt_failed() -> Self {
        Self::new("CRYPTO_DECRYPT_FAILED")
    }

    pub fn credential_not_found() -> Self {
        Self::new("CREDENTIAL_NOT_FOUND")
    }

    pub fn credential_decode_failed() -> Self {
        Self::new("CREDENTIAL_DECODE_FAILED")
    }

    pub fn derive_key_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("DERIVE_KEY_FAILED", detail)
    }

    // Hosts
    pub fn host_password_empty() -> Self {
        Self::new("HOST_PASSWORD_EMPTY")
    }

    pub fn host_password_not_stored() -> Self {
        Self::new("HOST_PASSWORD_NOT_STORED")
    }

    pub fn host_private_key_empty() -> Self {
        Self::new("HOST_PRIVATE_KEY_EMPTY")
    }

    pub fn host_private_key_not_stored() -> Self {
        Self::new("HOST_PRIVATE_KEY_NOT_STORED")
    }

    pub fn host_invalid_auth_type() -> Self {
        Self::new("HOST_INVALID_AUTH_TYPE")
    }

    pub fn host_key_not_found() -> Self {
        Self::new("HOST_KEY_NOT_FOUND")
    }

    pub fn host_not_found(host_id: impl Into<String>) -> Self {
        Self::with_params("HOST_NOT_FOUND", json!({ "hostId": host_id.into() }))
    }

    pub fn ssh_credentials_required() -> Self {
        Self::new("SSH_CREDENTIALS_REQUIRED")
    }

    // Keys
    pub fn key_name_required() -> Self {
        Self::new("KEY_NAME_REQUIRED")
    }

    pub fn key_pem_invalid() -> Self {
        Self::new("KEY_PEM_INVALID")
    }

    pub fn key_private_required() -> Self {
        Self::new("KEY_PRIVATE_REQUIRED")
    }

    pub fn key_not_found() -> Self {
        Self::new("KEY_NOT_FOUND")
    }

    pub fn key_algorithm_unsupported() -> Self {
        Self::new("KEY_ALGORITHM_UNSUPPORTED")
    }

    pub fn key_generate_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("KEY_GENERATE_FAILED", detail)
    }

    pub fn key_encode_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("KEY_ENCODE_FAILED", detail)
    }

    // Remote / SFTP
    pub fn remote_connect_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("REMOTE_CONNECT_FAILED", detail)
    }

    pub fn remote_ssh_session_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("REMOTE_SSH_SESSION_FAILED", detail)
    }

    pub fn remote_ssh_handshake_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("REMOTE_SSH_HANDSHAKE_FAILED", detail)
    }

    pub fn remote_password_required() -> Self {
        Self::new("REMOTE_PASSWORD_REQUIRED")
    }

    pub fn remote_private_key_required() -> Self {
        Self::new("REMOTE_PRIVATE_KEY_REQUIRED")
    }

    pub fn remote_password_auth_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("REMOTE_PASSWORD_AUTH_FAILED", detail)
    }

    pub fn remote_key_auth_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("REMOTE_KEY_AUTH_FAILED", detail)
    }

    pub fn remote_auth_type_unsupported(detail: impl Into<String>) -> Self {
        Self::with_detail("REMOTE_AUTH_TYPE_UNSUPPORTED", detail)
    }

    pub fn remote_not_authenticated() -> Self {
        Self::new("REMOTE_NOT_AUTHENTICATED")
    }

    pub fn remote_sftp_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("REMOTE_SFTP_FAILED", detail)
    }

    pub fn remote_ftp_connect_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("REMOTE_FTP_CONNECT_FAILED", detail)
    }

    pub fn remote_ftp_login_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("REMOTE_FTP_LOGIN_FAILED", detail)
    }

    pub fn remote_protocol_unsupported(detail: impl Into<String>) -> Self {
        Self::with_detail("REMOTE_PROTOCOL_UNSUPPORTED", detail)
    }

    pub fn remote_dir_read_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("REMOTE_DIR_READ_FAILED", detail)
    }

    pub fn remote_home_not_found() -> Self {
        Self::new("REMOTE_HOME_NOT_FOUND")
    }

    pub fn remote_not_directory(detail: impl Into<String>) -> Self {
        Self::with_detail("REMOTE_NOT_DIRECTORY", detail)
    }

    pub fn remote_local_read_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("REMOTE_LOCAL_READ_FAILED", detail)
    }

    pub fn remote_download_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("REMOTE_DOWNLOAD_FAILED", detail)
    }

    pub fn remote_upload_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("REMOTE_UPLOAD_FAILED", detail)
    }

    pub fn remote_invalid_filename() -> Self {
        Self::new("REMOTE_INVALID_FILENAME")
    }

    // Sync
    pub fn sync_request_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("SYNC_REQUEST_FAILED", detail)
    }

    pub fn sync_http_error(status: u16, body: impl Into<String>) -> Self {
        Self::with_params(
            "SYNC_HTTP_ERROR",
            json!({ "status": status, "body": body.into() }),
        )
    }

    pub fn sync_parse_failed(detail: impl Into<String>) -> Self {
        Self::with_detail("SYNC_PARSE_FAILED", detail)
    }

    pub fn sync_auth_invalid_token() -> Self {
        Self::new("SYNC_AUTH_INVALID_TOKEN")
    }

    // Snippets
    pub fn snippet_title_required() -> Self {
        Self::new("SNIPPET_TITLE_REQUIRED")
    }

    pub fn snippet_body_required() -> Self {
        Self::new("SNIPPET_BODY_REQUIRED")
    }

    pub fn snippet_not_found() -> Self {
        Self::new("SNIPPET_NOT_FOUND")
    }

    // SSH classification
    pub fn classify_ssh(raw: &str) -> Self {
        let lower = raw.to_lowercase();
        if lower.contains("connection refused") {
            return Self::new("SSH_CONNECTION_REFUSED");
        }
        if lower.contains("timed out") || lower.contains("timeout") {
            return Self::new("SSH_TIMEOUT");
        }
        if lower.contains("could not resolve") || lower.contains("adres çözülemedi") {
            return Self::new("SSH_DNS_FAILED");
        }
        if lower.contains("known_hosts") || lower.contains("host key") {
            return Self::new("SSH_HOST_KEY");
        }
        if lower.contains("connection reset") {
            return Self::new("SSH_CONNECTION_RESET");
        }
        if lower.contains("kimlik doğrulama") || lower.contains("authentication") {
            if raw.len() > 80 {
                return Self::with_params("SSH_AUTH_DETAIL", json!({ "detail": raw }));
            }
            return Self::new("SSH_AUTH_FAILED");
        }
        Self::with_params("SSH_UNKNOWN", json!({ "detail": raw }))
    }

    pub fn to_json_string(&self) -> String {
        serde_json::to_string(self).unwrap_or_else(|_| self.code.clone())
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.to_json_string())
    }
}

impl From<String> for AppError {
    fn from(value: String) -> Self {
        AppError::unknown(value)
    }
}

impl From<&str> for AppError {
    fn from(value: &str) -> Self {
        AppError::unknown(value)
    }
}

/// Bridges gradual migration: legacy `Result<T, String>` callers receive JSON payloads.
impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_json_string()
    }
}

pub type AppResult<T> = Result<T, AppError>;
