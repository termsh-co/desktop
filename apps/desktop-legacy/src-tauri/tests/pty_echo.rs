//! PTY integration test (no Tauri UI) — verifies portable-pty pipeline on CI.

use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use std::io::Read;
use std::time::Duration;

#[test]
fn pty_runs_echo_command() {
    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .expect("openpty");

    let mut cmd = CommandBuilder::new("echo");
    cmd.arg("termsh-pty-ok");

    let mut child = pair.slave.spawn_command(cmd).expect("spawn echo");
    drop(pair.slave);

    let mut reader = pair.master.try_clone_reader().expect("reader");
    let mut output = Vec::new();
    let mut buf = [0u8; 4096];

    let deadline = std::time::Instant::now() + Duration::from_secs(3);
    while std::time::Instant::now() < deadline {
        match reader.read(&mut buf) {
            Ok(0) => break,
            Ok(n) => output.extend_from_slice(&buf[..n]),
            Err(_) => break,
        }
        if output.windows(13).any(|w| w == b"termsh-pty-ok") {
            break;
        }
        std::thread::sleep(Duration::from_millis(50));
    }

    let _ = child.wait();
    let text = String::from_utf8_lossy(&output);
    assert!(
        text.contains("termsh-pty-ok"),
        "expected echo output, got: {text:?}"
    );
}
