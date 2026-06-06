use super::emit::TerminalEmitter;
use super::types::{SshSessionStatePayload, TerminalDataPayload, TerminalExitPayload};
use crate::error::AppError;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use ssh2::{KeyboardInteractivePrompt, Prompt, Session};
use std::io::{Read, Write};
use std::net::{TcpStream, ToSocketAddrs};
use std::sync::mpsc::{self, Receiver, Sender};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, Runtime};

pub struct SshAuth {
    pub username: String,
    pub password: Option<String>,
    pub private_key_pem: Option<String>,
    pub passphrase: Option<String>,
    /// Yalnızca parola — anahtar/agent denemelerini atla (MaxAuthTries / PAM).
    pub password_only: bool,
}

pub struct SshConnectConfig {
    pub host_id: String,
    pub hostname: String,
    pub port: u16,
    pub auth: SshAuth,
}

enum SshCommand {
    Write(Vec<u8>),
    Resize { cols: u32, rows: u32 },
    Close,
}

pub struct SshSessionHandle {
    write_tx: Sender<SshCommand>,
    thread: Option<std::thread::JoinHandle<()>>,
}

const DEFAULT_KEY_NAMES: &[&str] = &["id_ed25519", "id_rsa", "id_ecdsa"];

impl SshSessionHandle {
    pub fn spawn<R: Runtime>(
        session_id: String,
        config: SshConnectConfig,
        cols: u16,
        rows: u16,
        app: AppHandle<R>,
    ) -> Result<Self, String> {
        let (write_tx, write_rx) = mpsc::channel::<SshCommand>();
        let sid = session_id.clone();
        let app_worker = app.clone();

        let thread = std::thread::spawn(move || {
            if let Err(err) =
                run_ssh_session(&sid, config, cols, rows, write_rx, app_worker.clone())
            {
                let app_err = AppError::classify_ssh(&err);
                let payload = app_err.to_json_string();
                emit_session_state(&app_worker, &sid, "failed", Some(payload.clone()));
                emit_error(&app_worker, &sid, &payload);
            }
            let _ = app.emit("terminal-exit", TerminalExitPayload { session_id: sid });
        });

        Ok(Self {
            write_tx,
            thread: Some(thread),
        })
    }

    pub fn write(&self, data: &str) -> Result<(), String> {
        self.write_tx
            .send(SshCommand::Write(data.as_bytes().to_vec()))
            .map_err(|e| format!("SSH yazma kanalı kapalı: {e}"))
    }

    pub fn resize(&self, cols: u16, rows: u16) -> Result<(), String> {
        self.write_tx
            .send(SshCommand::Resize {
                cols: cols.max(2) as u32,
                rows: rows.max(2) as u32,
            })
            .map_err(|e| format!("SSH boyut kanalı kapalı: {e}"))
    }

    pub fn close(mut self) {
        let _ = self.write_tx.send(SshCommand::Close);
        if let Some(thread) = self.thread.take() {
            // Yeniden bağlanmayı bekletmemek için join'i arka planda yap.
            std::thread::spawn(move || {
                let _ = thread.join();
            });
        }
    }
}

fn run_ssh_session<R: Runtime>(
    session_id: &str,
    config: SshConnectConfig,
    cols: u16,
    rows: u16,
    write_rx: Receiver<SshCommand>,
    app: AppHandle<R>,
) -> Result<(), String> {
    let addr = format!("{}:{}", config.hostname, config.port);
    let tcp = connect_tcp(&addr)?;
    tcp.set_nodelay(true).ok();
    tcp.set_read_timeout(Some(Duration::from_millis(50))).ok();
    tcp.set_write_timeout(Some(Duration::from_secs(10))).ok();

    let mut sess = Session::new().map_err(|e| format!("SSH oturumu oluşturulamadı: {e}"))?;
    sess.set_tcp_stream(tcp);
    sess.set_timeout(12_000);
    load_known_hosts(&sess)?;
    sess.handshake()
        .map_err(|e| format!("SSH el sıkışması başarısız: {e}"))?;

    if let Some(banner) = sess.banner() {
        if let Some(platform) = super::os_detect::detect_platform_from_banner(banner) {
            if let Some(db) = app.try_state::<crate::db::Database>() {
                let _ = db.set_host_platform(&config.host_id, platform);
            }
            let _ = app.emit(
                "host-platform-detected",
                super::types::HostPlatformPayload {
                    host_id: config.host_id.clone(),
                    platform: platform.to_string(),
                },
            );
        }
    }

    authenticate(&sess, &config.auth)?;

    let mut channel = sess
        .channel_session()
        .map_err(|e| format!("SSH kanalı açılamadı: {e}"))?;
    channel
        .request_pty(
            "xterm-256color",
            None,
            Some((cols.max(2) as u32, rows.max(2) as u32, 0, 0)),
        )
        .map_err(|e| format!("PTY isteği reddedildi: {e}"))?;
    channel
        .shell()
        .map_err(|e| format!("Uzak shell başlatılamadı: {e}"))?;

    sess.set_blocking(false);

    emit_session_state(&app, session_id, "connected", None);

    let mut buf = [0u8; 8192];
    let mut closed = false;
    let mut emitter = TerminalEmitter::new(app.clone(), session_id.to_string());

    while !closed {
        while let Ok(command) = write_rx.try_recv() {
            match command {
                SshCommand::Write(data) => {
                    channel
                        .write_all(&data)
                        .map_err(|e| format!("SSH yazma hatası: {e}"))?;
                }
                SshCommand::Resize { cols, rows } => {
                    channel
                        .request_pty_size(cols, rows, None, None)
                        .map_err(|e| format!("SSH boyutlandırma hatası: {e}"))?;
                }
                SshCommand::Close => {
                    closed = true;
                    let _ = channel.close();
                    let _ = channel.wait_close();
                    let _ = sess.disconnect(None, "termsh kapatıldı", None);
                    break;
                }
            }
        }

        if closed {
            break;
        }

        match channel.read(&mut buf) {
            Ok(0) => break,
            Ok(n) => {
                emitter.push(&buf[..n]);
            }
            Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                // Okuma boşken yazmayı bekle — tuş vuruşları (Enter) gecikmesin.
                match write_rx.recv_timeout(Duration::from_millis(4)) {
                    Ok(SshCommand::Write(data)) => {
                        channel
                            .write_all(&data)
                            .map_err(|e| format!("SSH yazma hatası: {e}"))?;
                    }
                    Ok(SshCommand::Resize { cols, rows }) => {
                        channel
                            .request_pty_size(cols, rows, None, None)
                            .map_err(|e| format!("SSH boyutlandırma hatası: {e}"))?;
                    }
                    Ok(SshCommand::Close) => {
                        let _ = channel.close();
                        let _ = channel.wait_close();
                        let _ = sess.disconnect(None, "termsh kapatıldı", None);
                        closed = true;
                    }
                    Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {
                        std::thread::yield_now();
                    }
                    Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => {
                        closed = true;
                    }
                }
            }
            Err(e) if e.kind() == std::io::ErrorKind::TimedOut => {
                continue;
            }
            Err(_) => break,
        }
    }

    emitter.flush();
    Ok(())
}

/// Classifies raw SSH errors into structured codes for frontend i18n.
pub fn classify_ssh_error(raw: &str) -> AppError {
    AppError::classify_ssh(raw)
}

fn authenticate(sess: &Session, auth: &SshAuth) -> Result<(), String> {
    let username = auth.username.trim();
    let passphrase = auth.passphrase.as_deref();
    let password = auth.password.as_deref().filter(|p| !p.is_empty());
    let has_key = auth
        .private_key_pem
        .as_ref()
        .is_some_and(|k| !k.trim().is_empty());

    if let Some(pwd) = password {
        if try_password_auth(sess, username, pwd) {
            return Ok(());
        }

        let server_methods = sess
            .auth_methods(username)
            .unwrap_or("sunucu yanıt vermedi");
        return Err(format!(
            "Parola ile giriş başarısız (kullanıcı: «{username}»). \
             Sunucunun kabul ettiği yöntemler: {server_methods}. \
             Kullanıcı adı ve parolayı kontrol edin; bağlantı ekranından parolayı yeniden deneyin."
        ));
    }

    if auth.password_only {
        return Err(
            "Kayıtlı parola yok. Hostu düzenleyip parolayı kaydedin veya bağlantı ekranından girin."
                .into(),
        );
    }

    if let Some(key_pem) = &auth.private_key_pem {
        if try_pubkey_memory(sess, username, key_pem, passphrase) {
            return Ok(());
        }
    }

    if try_agent_auth(sess, username) {
        return Ok(());
    }

    if try_default_ssh_keys(sess, username, passphrase) {
        return Ok(());
    }

    if has_key {
        return Err(
            "Özel anahtar ile giriş başarısız. Anahtar formatını ve kullanıcı adını kontrol edin."
                .into(),
        );
    }

    Err(
        "Kimlik bilgisi eksik. Hosta parola veya anahtar kaydedin ya da bağlantı ekranından parola girin."
            .into(),
    )
}

fn try_password_auth(sess: &Session, username: &str, password: &str) -> bool {
    // Çoğu PAM sunucusu keyboard-interactive kullanır; düz password çoğu zaman kapalıdır.
    let mut prompter = PasswordPrompter {
        password: password.to_string(),
    };
    if sess
        .userauth_keyboard_interactive(username, &mut prompter)
        .is_ok()
        && sess.authenticated()
    {
        return true;
    }

    sess.userauth_password(username, password).is_ok() && sess.authenticated()
}

struct PasswordPrompter {
    password: String,
}

impl KeyboardInteractivePrompt for PasswordPrompter {
    fn prompt<'a>(
        &mut self,
        _username: &str,
        _instructions: &str,
        prompts: &[Prompt<'a>],
    ) -> Vec<String> {
        prompts
            .iter()
            .map(|p| {
                if p.echo {
                    String::new()
                } else {
                    self.password.clone()
                }
            })
            .collect()
    }
}

fn try_pubkey_memory(
    sess: &Session,
    username: &str,
    key_pem: &str,
    passphrase: Option<&str>,
) -> bool {
    crate::ssh_auth::userauth_pubkey_pem(sess, username, key_pem, passphrase)
        .is_ok()
        && sess.authenticated()
}

fn try_agent_auth(sess: &Session, username: &str) -> bool {
    sess.userauth_agent(username).is_ok() && sess.authenticated()
}

fn try_default_ssh_keys(sess: &Session, username: &str, passphrase: Option<&str>) -> bool {
    let home = match default_home_path() {
        Some(h) => h,
        None => return false,
    };
    let ssh_dir = home.join(".ssh");
    if !ssh_dir.is_dir() {
        return false;
    }

    for name in DEFAULT_KEY_NAMES {
        let private_key = ssh_dir.join(name);
        if !private_key.is_file() {
            continue;
        }
        let public_key = ssh_dir.join(format!("{name}.pub"));
        let public = if public_key.is_file() {
            Some(public_key.as_path())
        } else {
            None
        };
        if sess
            .userauth_pubkey_file(username, public, &private_key, passphrase)
            .is_ok()
            && sess.authenticated()
        {
            return true;
        }
    }
    false
}

fn connect_tcp(addr: &str) -> Result<TcpStream, String> {
    let timeout = Duration::from_secs(8);
    let mut last_error = String::from("Adres çözülemedi");
    for socket_addr in addr
        .to_socket_addrs()
        .map_err(|e| format!("Adres çözülemedi ({addr}): {e}"))?
    {
        match TcpStream::connect_timeout(&socket_addr, timeout) {
            Ok(stream) => return Ok(stream),
            Err(err) => last_error = format!("Bağlantı kurulamadı ({addr}): {err}"),
        }
    }
    Err(last_error)
}

fn load_known_hosts(sess: &Session) -> Result<(), String> {
    if let Some(home) = default_home_path() {
        let path = home.join(".ssh/known_hosts");
        if path.exists() {
            let mut known_hosts = sess
                .known_hosts()
                .map_err(|e| format!("known_hosts açılamadı: {e}"))?;
            known_hosts
                .read_file(&path, ssh2::KnownHostFileKind::OpenSSH)
                .map_err(|e| format!("known_hosts okunamadı: {e}"))?;
            return Ok(());
        }
    }
    Ok(())
}

fn default_home_path() -> Option<std::path::PathBuf> {
    #[cfg(target_os = "windows")]
    {
        if let Ok(userprofile) = std::env::var("USERPROFILE") {
            if !userprofile.is_empty() {
                return Some(std::path::PathBuf::from(userprofile));
            }
        }
    }
    std::env::var("HOME").ok().map(std::path::PathBuf::from)
}

fn emit_session_state<R: Runtime>(
    app: &AppHandle<R>,
    session_id: &str,
    state: &str,
    error: Option<String>,
) {
    let _ = app.emit(
        "ssh-session-state",
        SshSessionStatePayload {
            session_id: session_id.to_string(),
            state: state.to_string(),
            error,
        },
    );
}

fn emit_error<R: Runtime>(app: &AppHandle<R>, session_id: &str, err: &str) {
    let message = format!("\r\n\x1b[31mTERMSH_ERR:{err}\x1b[0m\r\n");
    let _ = app.emit(
        "terminal-data",
        TerminalDataPayload {
            session_id: session_id.to_string(),
            data: BASE64.encode(message.as_bytes()),
        },
    );
}

/// Kasadan gelen paroladaki yanlışlıkla eklenen satır sonlarını temizler (içeriği korur).
pub fn normalize_credential_secret(secret: String) -> String {
    secret.trim_end_matches(['\r', '\n']).to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn classify_maps_connection_refused() {
        let err = classify_ssh_error("Bağlantı kurulamadı: Connection refused");
        assert_eq!(err.code, "SSH_CONNECTION_REFUSED");
    }

    #[test]
    fn normalize_trims_trailing_newlines_only() {
        assert_eq!(normalize_credential_secret("  secret\n".into()), "  secret");
        assert_eq!(normalize_credential_secret("pass\r\n".into()), "pass");
    }
}
