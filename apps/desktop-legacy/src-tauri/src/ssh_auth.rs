//! PEM private-key auth: memory API on Unix, temp file on Windows (no OpenSSL vendoring).

use ssh2::Session;
use std::path::PathBuf;

pub fn userauth_pubkey_pem(
    sess: &Session,
    username: &str,
    key_pem: &str,
    passphrase: Option<&str>,
) -> Result<(), ssh2::Error> {
    #[cfg(unix)]
    {
        return sess.userauth_pubkey_memory(username, None, key_pem, passphrase);
    }

    #[cfg(windows)]
    {
        let path = write_temp_key(key_pem).map_err(|_| {
            ssh2::Error::new(
                ssh2::ErrorCode::Session(-37),
                "temp private key write failed",
            )
        })?;
        let result = sess.userauth_pubkey_file(username, None, &path, passphrase);
        let _ = std::fs::remove_file(&path);
        result
    }
}

#[cfg(windows)]
fn write_temp_key(key_pem: &str) -> std::io::Result<PathBuf> {
    let mut path = std::env::temp_dir();
    path.push(format!("termsh-key-{}.pem", uuid::Uuid::new_v4()));
    std::fs::write(&path, key_pem.as_bytes())?;
    Ok(path)
}
