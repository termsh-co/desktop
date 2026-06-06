use crate::error::{AppError, AppResult};
use rand::rngs::OsRng;
use ssh_key::{Algorithm, HashAlg, LineEnding, PrivateKey};

pub fn generate_ssh_key_pair(algorithm: &str) -> AppResult<(String, String)> {
    let alg = match algorithm {
        "ed25519" => Algorithm::Ed25519,
        "rsa" => Algorithm::Rsa {
            hash: Some(HashAlg::Sha256),
        },
        _ => return Err(AppError::key_algorithm_unsupported()),
    };

    let private_key = PrivateKey::random(&mut OsRng, alg)
        .map_err(|e| AppError::key_generate_failed(e.to_string()))?;

    let private_pem = private_key
        .to_openssh(LineEnding::LF)
        .map_err(|e| AppError::key_encode_failed(e.to_string()))?
        .to_string();

    let public_pem = private_key
        .public_key()
        .to_openssh()
        .map_err(|e| AppError::key_encode_failed(e.to_string()))?
        .to_string();

    Ok((private_pem, public_pem))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn generates_ed25519_pair() {
        let (priv_pem, pub_pem) = generate_ssh_key_pair("ed25519").expect("ed25519");
        assert!(priv_pem.contains("OPENSSH PRIVATE KEY"));
        assert!(pub_pem.starts_with("ssh-ed25519 "));
    }

    /// 4096-bit RSA generation is slow; run with `cargo test -- --ignored`.
    #[test]
    #[ignore]
    fn generates_rsa_pair() {
        let (priv_pem, pub_pem) = generate_ssh_key_pair("rsa").expect("rsa");
        assert!(priv_pem.contains("OPENSSH PRIVATE KEY"));
        assert!(pub_pem.starts_with("ssh-rsa "));
    }
}
