use crate::commands::remote_fs::RemoteConnectionConfig;
use crate::remote_connect::{connect_ftp, connect_sftp};
use ssh2::{Session as SshSession, Sftp};

use std::collections::HashMap;
use std::net::TcpStream;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use suppaftp::FtpStream;

const IDLE_TIMEOUT: Duration = Duration::from_secs(600);

fn config_fingerprint(cfg: &RemoteConnectionConfig) -> String {
    format!(
        "{}:{}:{}:{}",
        cfg.protocol.as_deref().unwrap_or("sftp"),
        cfg.host,
        cfg.port,
        cfg.username
    )
}

fn is_connection_error(msg: &str) -> bool {
    let lower = msg.to_lowercase();
    lower.contains("could not connect")
        || lower.contains("handshake")
        || lower.contains("authentication")
        || lower.contains("broken pipe")
        || lower.contains("connection reset")
        || lower.contains("eof")
        || lower.contains("timed out")
        || lower.contains("not connected")
        || lower.contains("failure")
}

struct SftpSlot {
    fingerprint: String,
    _tcp: TcpStream,
    _session: SshSession,
    sftp: Sftp,
    last_used: Instant,
}

struct FtpSlot {
    fingerprint: String,
    ftp: FtpStream,
    last_used: Instant,
}

pub struct RemoteFsPool {
    sftp: Mutex<HashMap<String, SftpSlot>>,
    ftp: Mutex<HashMap<String, FtpSlot>>,
}

impl Default for RemoteFsPool {
    fn default() -> Self {
        Self {
            sftp: Mutex::new(HashMap::new()),
            ftp: Mutex::new(HashMap::new()),
        }
    }
}

impl RemoteFsPool {
    pub fn disconnect_host(&self, host_id: &str) {
        if let Ok(mut map) = self.sftp.lock() {
            map.remove(host_id);
        }
        if let Ok(mut map) = self.ftp.lock() {
            map.remove(host_id);
        }
    }

    pub fn with_sftp<T>(
        &self,
        host_id: &str,
        config: &RemoteConnectionConfig,
        op: impl Fn(&Sftp) -> Result<T, String>,
    ) -> Result<T, String> {
        for attempt in 0..2 {
            let fp = config_fingerprint(config);
            let mut map = self
                .sftp
                .lock()
                .map_err(|e| format!("SFTP pool lock: {e}"))?;

            if let Some(slot) = map.get(host_id) {
                if slot.last_used.elapsed() > IDLE_TIMEOUT || slot.fingerprint != fp {
                    map.remove(host_id);
                }
            }

            if !map.contains_key(host_id) {
                let (tcp, session, sftp) = connect_sftp(config)?;
                map.insert(
                    host_id.to_string(),
                    SftpSlot {
                        fingerprint: fp,
                        _tcp: tcp,
                        _session: session,
                        sftp,
                        last_used: Instant::now(),
                    },
                );
            }

            let slot = map
                .get_mut(host_id)
                .ok_or_else(|| "SFTP pool entry missing.".to_string())?;
            slot.last_used = Instant::now();
            match op(&slot.sftp) {
                Ok(v) => return Ok(v),
                Err(e) if attempt == 0 && is_connection_error(&e) => {
                    map.remove(host_id);
                }
                Err(e) => return Err(e),
            }
        }
        Err("SFTP operation failed.".into())
    }

    pub fn with_ftp<T>(
        &self,
        host_id: &str,
        config: &RemoteConnectionConfig,
        op: impl Fn(&mut FtpStream) -> Result<T, String>,
    ) -> Result<T, String> {
        for attempt in 0..2 {
            let fp = config_fingerprint(config);
            let mut map = self
                .ftp
                .lock()
                .map_err(|e| format!("FTP pool lock: {e}"))?;

            if let Some(slot) = map.get(host_id) {
                if slot.last_used.elapsed() > IDLE_TIMEOUT || slot.fingerprint != fp {
                    map.remove(host_id);
                }
            }

            if !map.contains_key(host_id) {
                let ftp = connect_ftp(config)?;
                map.insert(
                    host_id.to_string(),
                    FtpSlot {
                        fingerprint: fp,
                        ftp,
                        last_used: Instant::now(),
                    },
                );
            }

            let slot = map
                .get_mut(host_id)
                .ok_or_else(|| "FTP pool entry missing.".to_string())?;
            slot.last_used = Instant::now();
            match op(&mut slot.ftp) {
                Ok(v) => return Ok(v),
                Err(e) if attempt == 0 && is_connection_error(&e) => {
                    map.remove(host_id);
                }
                Err(e) => return Err(e),
            }
        }
        Err("FTP operation failed.".into())
    }
}
