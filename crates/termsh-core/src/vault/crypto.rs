use aes_gcm::{
    aead::{Aead, KeyInit as _},
    Aes256Gcm, Key, Nonce,
};
use rand::RngCore;

use crate::error::{CoreError, CoreResult};

const NONCE_LEN: usize = 12;
const VERIFIER_PLAINTEXT: &[u8] = b"TERMSH_VAULT_V1";
const LEGACY_VERIFIER_PLAINTEXT: &[u8] = b"SIGNUM_VAULT_V1";

pub fn encrypt(secret_key: &[u8; 32], plaintext: &[u8]) -> CoreResult<Vec<u8>> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(secret_key));
    let mut nonce_bytes = [0u8; NONCE_LEN];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| CoreError::CryptoEncryptFailed(e.to_string()))?;
    let mut out = Vec::with_capacity(NONCE_LEN + ciphertext.len());
    out.extend_from_slice(&nonce_bytes);
    out.extend_from_slice(&ciphertext);
    Ok(out)
}

pub fn decrypt(secret_key: &[u8; 32], blob: &[u8]) -> CoreResult<Vec<u8>> {
    if blob.len() < NONCE_LEN {
        return Err(CoreError::CryptoInvalidData);
    }
    let (nonce_bytes, ciphertext) = blob.split_at(NONCE_LEN);
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(secret_key));
    let nonce = Nonce::from_slice(nonce_bytes);
    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| CoreError::CryptoDecryptFailed)
}

pub fn make_verifier(secret_key: &[u8; 32]) -> CoreResult<Vec<u8>> {
    encrypt(secret_key, VERIFIER_PLAINTEXT)
}

pub fn check_verifier(secret_key: &[u8; 32], blob: &[u8]) -> bool {
    decrypt(secret_key, blob)
        .map(|plain| plain == VERIFIER_PLAINTEXT || plain == LEGACY_VERIFIER_PLAINTEXT)
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encrypt_decrypt_roundtrip() {
        let key = [7u8; 32];
        let blob = encrypt(&key, b"ssh-password").expect("encrypt");
        let plain = decrypt(&key, &blob).expect("decrypt");
        assert_eq!(plain, b"ssh-password");
    }

    #[test]
    fn verifier_rejects_wrong_key() {
        let key = [1u8; 32];
        let other = [2u8; 32];
        let verifier = make_verifier(&key).expect("verifier");
        assert!(check_verifier(&key, &verifier));
        assert!(!check_verifier(&other, &verifier));
    }
}
