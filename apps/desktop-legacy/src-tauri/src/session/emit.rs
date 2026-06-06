use super::types::TerminalDataPayload;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Runtime};

/// PTY/SSH okuma döngüsünde UI'ı boğmamak için çıktıyı birleştirir.
pub struct TerminalEmitter<R: Runtime> {
    app: AppHandle<R>,
    session_id: String,
    buffer: Vec<u8>,
    last_flush: Instant,
}

impl<R: Runtime> TerminalEmitter<R> {
    const MAX_BUFFER: usize = 48 * 1024;
    const FLUSH_INTERVAL: Duration = Duration::from_millis(4);

    pub fn new(app: AppHandle<R>, session_id: String) -> Self {
        Self {
            app,
            session_id,
            buffer: Vec::with_capacity(4096),
            last_flush: Instant::now(),
        }
    }

    pub fn push(&mut self, data: &[u8]) {
        self.buffer.extend_from_slice(data);
        if self.buffer.len() >= Self::MAX_BUFFER
            || self.last_flush.elapsed() >= Self::FLUSH_INTERVAL
        {
            self.flush();
        }
    }

    pub fn flush(&mut self) {
        if self.buffer.is_empty() {
            return;
        }
        let payload = TerminalDataPayload {
            session_id: self.session_id.clone(),
            data: BASE64.encode(&self.buffer),
        };
        self.buffer.clear();
        self.last_flush = Instant::now();
        let _ = self.app.emit("terminal-data", payload);
    }
}
