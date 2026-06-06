use super::local::{self, LocalPtySession};
use super::ssh::{SshAuth, SshConnectConfig, SshSessionHandle};
use crate::db::{Database, HostRecord};
use crate::vault::Vault;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{AppHandle, Runtime, State};

enum BackendSession {
    Local(LocalPtySession),
    Ssh(SshSessionHandle),
}

pub struct SessionManager {
    sessions: Mutex<HashMap<String, BackendSession>>,
}

impl Default for SessionManager {
    fn default() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
        }
    }
}

impl SessionManager {
    pub fn spawn_local<R: Runtime>(
        &self,
        session_id: String,
        cols: u16,
        rows: u16,
        app: AppHandle<R>,
    ) -> Result<(), String> {
        let mut sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        if sessions.contains_key(&session_id) {
            return Ok(());
        }
        let local = local::spawn_local(session_id.clone(), cols, rows, app)?;
        sessions.insert(session_id, BackendSession::Local(local));
        Ok(())
    }

    pub fn spawn_ssh<R: Runtime>(
        &self,
        session_id: String,
        host: &HostRecord,
        password: Option<String>,
        private_key_pem: Option<String>,
        cols: u16,
        rows: u16,
        app: AppHandle<R>,
        db: &Database,
    ) -> Result<(), String> {
        let mut sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        if let Some(existing) = sessions.remove(&session_id) {
            match existing {
                BackendSession::Local(local) => local::close(local),
                BackendSession::Ssh(ssh) => ssh.close(),
            }
        }

        let auth = SshAuth {
            username: host.username.trim().to_string(),
            password,
            private_key_pem,
            passphrase: None,
            password_only: host.auth_type == "password",
        };

        let config = SshConnectConfig {
            host_id: host.id.clone(),
            hostname: host.hostname.clone(),
            port: host.port,
            auth,
        };

        let ssh = SshSessionHandle::spawn(session_id.clone(), config, cols, rows, app)?;
        sessions.insert(session_id, BackendSession::Ssh(ssh));
        drop(sessions);

        db.touch_host_connected(&host.id)?;
        Ok(())
    }

    pub fn write(&self, session_id: &str, data: &str) -> Result<(), String> {
        let sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        match sessions.get(session_id) {
            Some(BackendSession::Local(local)) => local::write(local, data),
            Some(BackendSession::Ssh(ssh)) => ssh.write(data),
            None => Err(format!("Oturum bulunamadı: {session_id}")),
        }
    }

    pub fn resize(&self, session_id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        match sessions.get(session_id) {
            Some(BackendSession::Local(local)) => local::resize(local, cols, rows),
            Some(BackendSession::Ssh(ssh)) => ssh.resize(cols, rows),
            None => Err(format!("Oturum bulunamadı: {session_id}")),
        }
    }

    pub fn close(&self, session_id: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        if let Some(session) = sessions.remove(session_id) {
            match session {
                BackendSession::Local(local) => local::close(local),
                BackendSession::Ssh(ssh) => ssh.close(),
            }
        }
        Ok(())
    }

    #[cfg(test)]
    pub fn has_session(&self, session_id: &str) -> bool {
        self.sessions
            .lock()
            .map(|sessions| sessions.contains_key(session_id))
            .unwrap_or(false)
    }
}

#[tauri::command]
pub fn spawn_local_shell(
    session_id: String,
    cols: u16,
    rows: u16,
    app: AppHandle,
    manager: State<'_, SessionManager>,
) -> Result<(), String> {
    manager.spawn_local(session_id, cols.max(2), rows.max(2), app)
}

#[tauri::command]
pub fn spawn_ssh_shell(
    session_id: String,
    host_id: String,
    cols: u16,
    rows: u16,
    connect_password: Option<String>,
    app: AppHandle,
    manager: State<'_, SessionManager>,
    db: State<'_, Database>,
    vault: State<'_, Vault>,
) -> Result<(), String> {
    let host = db
        .get_host(&host_id)?
        .ok_or_else(|| crate::error::AppError::host_not_found(&host_id))?;

    let needs_vault_secret = host.credential_ref.is_some() || host.private_key_ref.is_some();
    if needs_vault_secret {
        crate::vault::access::require_vault_for_ssh_secrets(&db, &vault)?;
    }

    let password = if let Some(pwd) = connect_password.filter(|p| !p.is_empty()) {
        Some(crate::session::ssh::normalize_credential_secret(pwd))
    } else if let Some(ref_id) = &host.credential_ref {
        Some(crate::session::ssh::normalize_credential_secret(
            vault.load_secret(&db, ref_id)?,
        ))
    } else {
        None
    };

    let private_key_pem = if let Some(ref_id) = &host.private_key_ref {
        let pem = vault.load_secret(&db, ref_id)?;
        Some(pem.replace("\r\n", "\n").trim().to_string())
    } else {
        None
    };

    if password.is_none() && private_key_pem.is_none() {
        return Err(crate::error::AppError::ssh_credentials_required().into());
    }

    manager.spawn_ssh(
        session_id,
        &host,
        password,
        private_key_pem,
        cols.max(2),
        rows.max(2),
        app,
        &db,
    )
}

#[tauri::command]
pub fn terminal_write(
    session_id: String,
    data: String,
    manager: State<'_, SessionManager>,
) -> Result<(), String> {
    manager.write(&session_id, &data)
}

#[tauri::command]
pub fn terminal_resize(
    session_id: String,
    cols: u16,
    rows: u16,
    manager: State<'_, SessionManager>,
) -> Result<(), String> {
    manager.resize(&session_id, cols, rows)
}

#[tauri::command]
pub fn close_session(session_id: String, manager: State<'_, SessionManager>) -> Result<(), String> {
    manager.close(&session_id)
}

#[cfg(test)]
mod tests {
    use super::super::local::default_shell_for_test;
    use super::*;
    use crate::session::types::TerminalDataPayload;
    use std::time::Duration;
    use tauri::test::{mock_builder, mock_context, noop_assets};
    use tauri::Manager;

    #[test]
    fn terminal_payload_serializes_camel_case() {
        let payload = TerminalDataPayload {
            session_id: "abc".into(),
            data: "ZGF0YQ==".into(),
        };
        let value = serde_json::to_value(payload).unwrap();
        assert_eq!(value["sessionId"], "abc");
    }

    #[test]
    fn write_unknown_session_returns_error() {
        let manager = SessionManager::default();
        let err = manager.write("missing", "echo").unwrap_err();
        assert!(err.contains("bulunamadı"));
    }

    #[test]
    fn default_shell_uses_expected_fallback() {
        let cmd = default_shell_for_test();
        let argv0 = cmd.get_argv()[0].to_string_lossy();
        assert!(!argv0.is_empty());
    }

    #[test]
    fn spawn_local_is_idempotent_for_same_session_id() {
        let app = mock_builder()
            .manage(SessionManager::default())
            .build(mock_context(noop_assets()))
            .expect("mock app");

        let handle = app.handle().clone();
        let manager = app.state::<SessionManager>();
        let session_id = "duplicate-spawn".to_string();

        manager
            .spawn_local(session_id.clone(), 80, 24, handle.clone())
            .expect("first spawn");
        manager
            .spawn_local(session_id.clone(), 80, 24, handle)
            .expect("second spawn");

        assert!(manager.has_session(&session_id));
        manager.close(&session_id).expect("close");
        std::thread::sleep(Duration::from_millis(100));
        assert!(!manager.has_session(&session_id));
    }
}
