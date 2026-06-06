use argon2::{Algorithm, Argon2, Params, Version};
use rand::RngCore;

use crate::error::{CoreError, CoreResult};

pub const SALT_LEN: usize = 16;

pub fn random_salt() -> Vec<u8> {
    let mut salt = vec![0u8; SALT_LEN];
    rand::thread_rng().fill_bytes(&mut salt);
    salt
}

pub fn derive_master_key(password: &str, salt: &[u8]) -> CoreResult<[u8; 32]> {
    let params = Params::new(19_456, 2, 1, Some(32))
        .map_err(|e| CoreError::DeriveKeyFailed(e.to_string()))?;
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let mut key = [0u8; 32];
    argon2
        .hash_password_into(password.as_bytes(), salt, &mut key)
        .map_err(|e| CoreError::DeriveKeyFailed(e.to_string()))?;
    Ok(key)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn derive_is_deterministic_for_same_salt() {
        let salt = random_salt();
        let a = derive_master_key("test-password-123", &salt).expect("a");
        let b = derive_master_key("test-password-123", &salt).expect("b");
        assert_eq!(a, b);
    }
}
