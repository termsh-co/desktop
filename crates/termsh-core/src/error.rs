use thiserror::Error;

pub type CoreResult<T> = Result<T, CoreError>;

#[derive(Debug, Error)]
pub enum CoreError {
    #[error("vault password must be at least 8 characters")]
    VaultPasswordTooShort,
    #[error("vault is locked")]
    VaultLocked,
    #[error("wrong vault password")]
    VaultWrongPassword,
    #[error("invalid vault key")]
    VaultInvalidKey,
    #[error("encrypt failed: {0}")]
    CryptoEncryptFailed(String),
    #[error("invalid encrypted data")]
    CryptoInvalidData,
    #[error("decrypt failed")]
    CryptoDecryptFailed,
    #[error("key derivation failed: {0}")]
    DeriveKeyFailed(String),
    #[error("database error: {0}")]
    Database(String),
    #[error("vault already setup")]
    VaultAlreadySetup,
    #[error("vault not setup")]
    VaultNotSetup,
    #[error("credential not found")]
    CredentialNotFound,
    #[error("credential decode failed")]
    CredentialDecodeFailed,
    #[error("internal error: {0}")]
    Internal(String),
}
