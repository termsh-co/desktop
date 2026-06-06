use crate::error::{AppError, AppResult};
use termsh_core::vault as core_vault;

fn map_crypto_err(err: termsh_core::error::CoreError) -> AppError {
    match err {
        termsh_core::error::CoreError::CryptoEncryptFailed(d) => AppError::crypto_encrypt_failed(d),
        termsh_core::error::CoreError::CryptoInvalidData => AppError::crypto_invalid_data(),
        termsh_core::error::CoreError::CryptoDecryptFailed => AppError::crypto_decrypt_failed(),
        other => AppError::unknown(other.to_string()),
    }
}

pub fn encrypt(secret_key: &[u8; 32], plaintext: &[u8]) -> AppResult<Vec<u8>> {
    core_vault::encrypt(secret_key, plaintext).map_err(map_crypto_err)
}

pub fn decrypt(secret_key: &[u8; 32], blob: &[u8]) -> AppResult<Vec<u8>> {
    core_vault::decrypt(secret_key, blob).map_err(map_crypto_err)
}

pub fn make_verifier(secret_key: &[u8; 32]) -> AppResult<Vec<u8>> {
    core_vault::make_verifier(secret_key).map_err(map_crypto_err)
}

pub fn check_verifier(secret_key: &[u8; 32], blob: &[u8]) -> bool {
    core_vault::check_verifier(secret_key, blob)
}
