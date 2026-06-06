use super::emit::TerminalEmitter;
use super::types::TerminalExitPayload;
use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Runtime};

pub struct LocalPtySession {
    master: Arc<Mutex<Box<dyn MasterPty + Send>>>,
    writer: Arc<Mutex<Box<dyn Write + Send>>>,
    child: Arc<Mutex<Box<dyn Child + Send + Sync>>>,
}

pub fn spawn_local<R: Runtime>(
    session_id: String,
    cols: u16,
    rows: u16,
    app: AppHandle<R>,
) -> Result<LocalPtySession, String> {
    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("PTY açılamadı: {e}"))?;

    let cmd = default_shell();
    let child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("Shell başlatılamadı: {e}"))?;
    drop(pair.slave);

    let reader = pair
        .master
        .try_clone_reader()
        .map_err(|e| format!("PTY okuyucu alınamadı: {e}"))?;
    let writer = pair
        .master
        .take_writer()
        .map_err(|e| format!("PTY yazıcı alınamadı: {e}"))?;

    let master: Arc<Mutex<Box<dyn MasterPty + Send>>> = Arc::new(Mutex::new(pair.master));
    let writer: Arc<Mutex<Box<dyn Write + Send>>> = Arc::new(Mutex::new(writer));
    let child_handle: Arc<Mutex<Box<dyn Child + Send + Sync>>> = Arc::new(Mutex::new(child));

    let session = LocalPtySession {
        master: Arc::clone(&master),
        writer: Arc::clone(&writer),
        child: Arc::clone(&child_handle),
    };

    let app_reader = app.clone();
    let sid = session_id.clone();
    std::thread::spawn(move || read_pty_loop(reader, sid, app_reader));

    Ok(session)
}

pub fn write(session: &LocalPtySession, data: &str) -> Result<(), String> {
    let mut writer = session.writer.lock().map_err(|e| e.to_string())?;
    writer
        .write_all(data.as_bytes())
        .map_err(|e| format!("Yazma hatası: {e}"))?;
    Ok(())
}

pub fn resize(session: &LocalPtySession, cols: u16, rows: u16) -> Result<(), String> {
    let master = session.master.lock().map_err(|e| e.to_string())?;
    master
        .resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("Boyutlandırma hatası: {e}"))?;
    Ok(())
}

pub fn close(session: LocalPtySession) {
    if let Ok(mut child) = session.child.lock() {
        let _ = child.kill();
        for _ in 0..20 {
            match child.try_wait() {
                Ok(Some(_)) | Err(_) => break,
                Ok(None) => std::thread::sleep(std::time::Duration::from_millis(25)),
            }
        }
    }
}

fn read_pty_loop<R: Runtime>(
    mut reader: Box<dyn Read + Send>,
    session_id: String,
    app: AppHandle<R>,
) {
    let mut buf = [0u8; 8192];
    let mut emitter = TerminalEmitter::new(app.clone(), session_id.clone());
    loop {
        match reader.read(&mut buf) {
            Ok(0) => break,
            Ok(n) => {
                emitter.push(&buf[..n]);
            }
            Err(_) => break,
        }
    }
    emitter.flush();
    let _ = app.emit(
        "terminal-exit",
        TerminalExitPayload {
            session_id: session_id.clone(),
        },
    );
}

#[cfg(test)]
pub(crate) fn default_shell_for_test() -> CommandBuilder {
    default_shell()
}

fn default_shell() -> CommandBuilder {
    if cfg!(windows) {
        let mut cmd = CommandBuilder::new("powershell.exe");
        cmd.args(["-NoLogo"]);
        return cmd;
    }

    if let Ok(shell) = std::env::var("SHELL") {
        if !shell.is_empty() {
            return CommandBuilder::new(shell);
        }
    }

    if cfg!(target_os = "macos") {
        CommandBuilder::new("/bin/zsh")
    } else {
        CommandBuilder::new("/bin/bash")
    }
}
