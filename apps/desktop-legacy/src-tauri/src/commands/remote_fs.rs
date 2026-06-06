use crate::db::Database;
use crate::error::{AppError, AppResult};
use crate::vault::access::{allow_host_read, require_vault_for_ssh_secrets};
use crate::vault::Vault;
use serde::{Deserialize, Serialize};
use ssh2::{Session as SshSession, Sftp};
use std::fs::{self, File};
use std::io;
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::time::Duration;
use suppaftp::FtpStream;
use tauri::State;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoteConnectionConfig {
    /// "sftp" (default) or "ftp"
    pub protocol: Option<String>,
    pub host: String,
    pub port: u16,
    pub username: String,
    /// "password" or "privateKey"
    pub authType: String,
    pub password: Option<String>,
    /// Unencrypted private key in OpenSSH PEM format.
    pub privateKeyPem: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListDirPayload {
    pub connection: RemoteConnectionConfig,
    pub path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HostConnectPayload {
    pub hostId: String,
    pub connectPassword: Option<String>,
    pub connectPrivateKeyPem: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListDirHostPayload {
    pub hostId: String,
    pub path: String,
    pub connectPassword: Option<String>,
    pub connectPrivateKeyPem: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoteTransferHostPayload {
    pub hostId: String,
    pub remotePath: String,
    pub localPath: String,
    pub connectPassword: Option<String>,
    pub connectPrivateKeyPem: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoteFileEntry {
    pub name: String,
    pub path: String,
    pub kind: String,
    pub size: Option<u64>,
    pub modified_at: Option<String>,
}

fn protocol(cfg: &RemoteConnectionConfig) -> &str {
    cfg.protocol.as_deref().unwrap_or("sftp")
}

fn connect_sftp(cfg: &RemoteConnectionConfig) -> AppResult<(TcpStream, Sftp)> {
    let addr = format!("{}:{}", cfg.host, cfg.port);
    let tcp = TcpStream::connect(&addr)
        .map_err(|e| AppError::remote_connect_failed(format!("{addr}: {e}")))?;
    tcp.set_read_timeout(Some(Duration::from_secs(15))).ok();
    tcp.set_write_timeout(Some(Duration::from_secs(15))).ok();

    let mut sess = SshSession::new()
        .map_err(|e| AppError::remote_ssh_session_failed(e.to_string()))?;
    sess.set_tcp_stream(
        tcp.try_clone()
            .map_err(|e| AppError::remote_connect_failed(e.to_string()))?,
    );
    sess.handshake()
        .map_err(|e| AppError::remote_ssh_handshake_failed(e.to_string()))?;

    match cfg.authType.as_str() {
        "password" => {
            let password = cfg
                .password
                .as_deref()
                .ok_or_else(AppError::remote_password_required)?;
            sess.userauth_password(&cfg.username, password)
                .map_err(|e| AppError::remote_password_auth_failed(e.to_string()))?;
        }
        "privateKey" | "private_key" => {
            let key = cfg
                .privateKeyPem
                .as_deref()
                .ok_or_else(AppError::remote_private_key_required)?;
            crate::ssh_auth::userauth_pubkey_pem(&sess, &cfg.username, key, cfg.password.as_deref())
                .map_err(|e| AppError::remote_key_auth_failed(e.to_string()))?;
        }
        other => {
            return Err(AppError::remote_auth_type_unsupported(other.to_string()));
        }
    }

    if !sess.authenticated() {
        return Err(AppError::remote_not_authenticated());
    }

    let sftp = sess
        .sftp()
        .map_err(|e| AppError::remote_sftp_failed(e.to_string()))?;
    Ok((tcp, sftp))
}

fn connect_ftp(cfg: &RemoteConnectionConfig) -> AppResult<FtpStream> {
    let addr = format!("{}:{}", cfg.host, cfg.port);
    let mut ftp = FtpStream::connect(addr)
        .map_err(|e| AppError::remote_ftp_connect_failed(e.to_string()))?;

    let pwd = cfg
        .password
        .as_ref()
        .ok_or_else(AppError::remote_password_required)?;
    ftp.login(&cfg.username, pwd)
        .map_err(|e| AppError::remote_ftp_login_failed(e.to_string()))?;
    Ok(ftp)
}

fn build_sftp_config_from_host(
    db: &Database,
    vault: &Vault,
    payload: HostConnectPayload,
) -> AppResult<RemoteConnectionConfig> {
    let host = db
        .get_host(&payload.hostId)
        .map_err(AppError::database)?
        .ok_or_else(|| AppError::host_not_found(&payload.hostId))?;

    let needs_vault_secret = host.credential_ref.is_some() || host.private_key_ref.is_some();
    if needs_vault_secret {
        require_vault_for_ssh_secrets(db, vault)?;
    }

    fn normalize_secret(secret: String) -> String {
        secret.trim_end_matches(['\r', '\n']).to_string()
    }

    let password = if let Some(pwd) = payload.connectPassword.filter(|p| !p.is_empty()) {
        Some(normalize_secret(pwd))
    } else if let Some(ref_id) = &host.credential_ref {
        Some(normalize_secret(vault.load_secret(db, ref_id)?))
    } else {
        None
    };

    let privateKeyPem = if let Some(pem) = payload
        .connectPrivateKeyPem
        .filter(|p| !p.trim().is_empty())
    {
        Some(pem.replace("\r\n", "\n").trim().to_string())
    } else if let Some(ref_id) = &host.private_key_ref {
        let pem = vault.load_secret(db, ref_id)?;
        Some(pem.replace("\r\n", "\n").trim().to_string())
    } else {
        None
    };

    if password.is_none() && privateKeyPem.is_none() {
        return Err(AppError::ssh_credentials_required());
    }

    Ok(RemoteConnectionConfig {
        protocol: Some("sftp".into()),
        host: host.hostname,
        port: host.port,
        username: host.username,
        authType: host.auth_type,
        password,
        privateKeyPem,
    })
}

fn sort_entries(entries: &mut [RemoteFileEntry]) {
    entries.sort_by(|a, b| {
        let a_dir = a.kind == "directory";
        let b_dir = b.kind == "directory";
        match (a_dir, b_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
}

fn expand_local_path(path: &str) -> AppResult<PathBuf> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return local_home_path();
    }
    if trimmed == "~" || trimmed.starts_with("~/") || trimmed.starts_with("~\\") {
        let home = local_home_path()?;
        if trimmed == "~" {
            return Ok(home);
        }
        let rest = trimmed
            .trim_start_matches('~')
            .trim_start_matches(['/', '\\']);
        return Ok(home.join(rest));
    }
    Ok(PathBuf::from(trimmed))
}

fn local_home_path() -> AppResult<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        if let Ok(userprofile) = std::env::var("USERPROFILE") {
            if !userprofile.is_empty() {
                return Ok(PathBuf::from(userprofile));
            }
        }
    }
    std::env::var("HOME")
        .map(PathBuf::from)
        .map_err(|_| AppError::remote_home_not_found())
}

fn join_remote_path(dir: &str, name: &str) -> String {
    let clean_name = name.trim_start_matches('/');
    if dir == "/" {
        return format!("/{clean_name}");
    }
    format!("{}/{}", dir.trim_end_matches('/'), clean_name)
}

fn sftp_download_file(sftp: &Sftp, remote_path: &str, local_path: &str) -> AppResult<()> {
    let mut remote = sftp
        .open(Path::new(remote_path))
        .map_err(|e| AppError::remote_download_failed(format!("{remote_path}: {e}")))?;
    let mut local = File::create(local_path)
        .map_err(|e| AppError::remote_download_failed(format!("{local_path}: {e}")))?;
    io::copy(&mut remote, &mut local)
        .map_err(|e| AppError::remote_download_failed(e.to_string()))?;
    Ok(())
}

fn sftp_upload_file(sftp: &Sftp, local_path: &str, remote_path: &str) -> AppResult<()> {
    let mut local = File::open(local_path)
        .map_err(|e| AppError::remote_upload_failed(format!("{local_path}: {e}")))?;
    let mut remote = sftp
        .create(Path::new(remote_path))
        .map_err(|e| AppError::remote_upload_failed(format!("{remote_path}: {e}")))?;
    io::copy(&mut local, &mut remote)
        .map_err(|e| AppError::remote_upload_failed(e.to_string()))?;
    Ok(())
}

fn ftp_download_file(
    ftp: &mut FtpStream,
    remote_path: &str,
    local_path: &str,
) -> AppResult<()> {
    let mut buffer = ftp
        .retr_as_buffer(remote_path)
        .map_err(|e| AppError::remote_download_failed(e.to_string()))?;
    let mut local = File::create(local_path)
        .map_err(|e| AppError::remote_download_failed(format!("{local_path}: {e}")))?;
    io::copy(&mut buffer, &mut local)
        .map_err(|e| AppError::remote_download_failed(e.to_string()))?;
    Ok(())
}

fn ftp_upload_file(ftp: &mut FtpStream, local_path: &str, remote_path: &str) -> AppResult<()> {
    let mut local = File::open(local_path)
        .map_err(|e| AppError::remote_upload_failed(format!("{local_path}: {e}")))?;
    ftp.put_file(remote_path, &mut local)
        .map_err(|e| AppError::remote_upload_failed(e.to_string()))?;
    Ok(())
}

fn map_file_kind(is_file: bool, is_dir: bool) -> &'static str {
    if is_dir {
        "directory"
    } else if is_file {
        "file"
    } else {
        "other"
    }
}

#[tauri::command]
pub fn remote_test_connection(config: RemoteConnectionConfig) -> Result<(), AppError> {
    match protocol(&config) {
        "sftp" => {
            let (tcp, _sftp) = connect_sftp(&config)?;
            drop(_sftp);
            drop(tcp);
        }
        "ftp" => {
            let mut ftp = connect_ftp(&config)?;
            let _ = ftp.quit();
        }
        other => return Err(AppError::remote_protocol_unsupported(other.to_string())),
    }
    Ok(())
}

#[tauri::command]
pub fn remote_test_connection_host(
    payload: HostConnectPayload,
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<(), AppError> {
    allow_host_read(&db, &vault)?;
    let config = build_sftp_config_from_host(&db, &vault, payload)?;
    remote_test_connection(config)
}

#[tauri::command]
pub fn remote_list_dir(payload: ListDirPayload) -> Result<Vec<RemoteFileEntry>, AppError> {
    match protocol(&payload.connection) {
        "sftp" => {
            let (_tcp, sftp) = connect_sftp(&payload.connection)?;
            let path = PathBuf::from(&payload.path);

            let entries = sftp
                .readdir(&path)
                .map_err(|e| AppError::remote_dir_read_failed(format!("{}: {e}", payload.path)))?;

            let mut result = Vec::with_capacity(entries.len());
            for (entry_path, stat) in entries {
                let name = entry_path
                    .file_name()
                    .and_then(|s| s.to_str())
                    .unwrap_or_default()
                    .to_string();

                let kind = map_file_kind(stat.is_file(), stat.is_dir()).to_string();

                let size = stat.size;
                let modified_at = stat.mtime.map(|secs| {
                    let dt = chrono::DateTime::<chrono::Utc>::from_timestamp(secs as i64, 0);
                    dt.map(|d| d.to_rfc3339()).unwrap_or_default()
                });

                result.push(RemoteFileEntry {
                    name,
                    path: entry_path.to_string_lossy().to_string(),
                    kind,
                    size,
                    modified_at,
                });
            }

            sort_entries(&mut result);
            Ok(result)
        }
        "ftp" => {
            let mut ftp = connect_ftp(&payload.connection)?;
            ftp.cwd(&payload.path)
                .map_err(|e| AppError::remote_dir_read_failed(format!("{}: {e}", payload.path)))?;
            let names = ftp
                .nlst(None)
                .map_err(|e| AppError::remote_dir_read_failed(format!("{}: {e}", payload.path)))?;

            let mut result = names
                .into_iter()
                .map(|name| {
                    let full = if payload.path == "/" {
                        format!("/{}", name.trim_start_matches('/'))
                    } else {
                        format!(
                            "{}/{}",
                            payload.path.trim_end_matches('/'),
                            name.trim_start_matches('/')
                        )
                    };
                    RemoteFileEntry {
                        name,
                        path: full,
                        kind: "other".to_string(),
                        size: None,
                        modified_at: None,
                    }
                })
                .collect::<Vec<_>>();

            sort_entries(&mut result);
            let _ = ftp.quit();
            Ok(result)
        }
        other => Err(AppError::remote_protocol_unsupported(other.to_string())),
    }
}

#[tauri::command]
pub fn local_home_dir() -> Result<String, AppError> {
    local_home_path().map(|p| p.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn local_list_dir(path: String) -> Result<Vec<RemoteFileEntry>, AppError> {
    let dir = expand_local_path(&path)?;
    if !dir.is_dir() {
        return Err(AppError::remote_not_directory(dir.to_string_lossy().to_string()));
    }

    let mut result = Vec::new();
    let entries = fs::read_dir(&dir)
        .map_err(|e| AppError::remote_local_read_failed(format!("{}: {e}", dir.display())))?;

    for entry in entries {
        let entry = entry
            .map_err(|e| AppError::remote_local_read_failed(e.to_string()))?;
        let name = entry.file_name().to_string_lossy().into_owned();
        if name == "." {
            continue;
        }

        let full_path = entry.path();
        let metadata = entry.metadata().map_err(|e| {
            AppError::remote_local_read_failed(format!("{}: {e}", full_path.display()))
        })?;

        let kind = if metadata.is_dir() {
            "directory"
        } else if metadata.is_file() {
            "file"
        } else {
            "other"
        };

        let size = if metadata.is_file() {
            Some(metadata.len())
        } else {
            None
        };
        let modified_at = metadata.modified().ok().and_then(|t| {
            t.duration_since(std::time::UNIX_EPOCH).ok().and_then(|d| {
                chrono::DateTime::<chrono::Utc>::from_timestamp(d.as_secs() as i64, 0)
                    .map(|dt| dt.to_rfc3339())
            })
        });

        result.push(RemoteFileEntry {
            name,
            path: full_path.to_string_lossy().into_owned(),
            kind: kind.to_string(),
            size,
            modified_at,
        });
    }

    sort_entries(&mut result);
    Ok(result)
}

#[tauri::command]
pub fn remote_download_host(
    payload: RemoteTransferHostPayload,
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<(), AppError> {
    allow_host_read(&db, &vault)?;
    let config = build_sftp_config_from_host(
        &db,
        &vault,
        HostConnectPayload {
            hostId: payload.hostId,
            connectPassword: payload.connectPassword,
            connectPrivateKeyPem: payload.connectPrivateKeyPem,
        },
    )?;

    match protocol(&config) {
        "sftp" => {
            let (_tcp, sftp) = connect_sftp(&config)?;
            sftp_download_file(&sftp, &payload.remotePath, &payload.localPath)?;
        }
        "ftp" => {
            let mut ftp = connect_ftp(&config)?;
            ftp_download_file(&mut ftp, &payload.remotePath, &payload.localPath)?;
            let _ = ftp.quit();
        }
        other => return Err(AppError::remote_protocol_unsupported(other.to_string())),
    }
    Ok(())
}

#[tauri::command]
pub fn remote_upload_host(
    payload: RemoteTransferHostPayload,
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<(), AppError> {
    allow_host_read(&db, &vault)?;
    let config = build_sftp_config_from_host(
        &db,
        &vault,
        HostConnectPayload {
            hostId: payload.hostId,
            connectPassword: payload.connectPassword,
            connectPrivateKeyPem: payload.connectPrivateKeyPem,
        },
    )?;

    let remote_path = if payload.remotePath.ends_with('/') {
        let file_name = Path::new(&payload.localPath)
            .file_name()
            .and_then(|s| s.to_str())
            .ok_or_else(AppError::remote_invalid_filename)?;
        join_remote_path(payload.remotePath.trim_end_matches('/'), file_name)
    } else {
        payload.remotePath
    };

    match protocol(&config) {
        "sftp" => {
            let (_tcp, sftp) = connect_sftp(&config)?;
            sftp_upload_file(&sftp, &payload.localPath, &remote_path)?;
        }
        "ftp" => {
            let mut ftp = connect_ftp(&config)?;
            ftp_upload_file(&mut ftp, &payload.localPath, &remote_path)?;
            let _ = ftp.quit();
        }
        other => return Err(AppError::remote_protocol_unsupported(other.to_string())),
    }
    Ok(())
}

#[tauri::command]
pub fn remote_list_dir_host(
    payload: ListDirHostPayload,
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<Vec<RemoteFileEntry>, AppError> {
    allow_host_read(&db, &vault)?;
    let config = build_sftp_config_from_host(
        &db,
        &vault,
        HostConnectPayload {
            hostId: payload.hostId,
            connectPassword: payload.connectPassword,
            connectPrivateKeyPem: payload.connectPrivateKeyPem,
        },
    )?;
    remote_list_dir(ListDirPayload {
        connection: config,
        path: payload.path,
    })
}
