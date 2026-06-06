use crate::commands::remote_fs::RemoteConnectionConfig;
use ssh2::{Session as SshSession, Sftp};
use std::io::{Read, Write};
use std::net::TcpStream;
use std::time::Duration;
use suppaftp::FtpStream;

pub const TRANSFER_BUF_SIZE: usize = 256 * 1024;

pub fn connect_sftp(cfg: &RemoteConnectionConfig) -> Result<(TcpStream, SshSession, Sftp), String> {
    let addr = format!("{}:{}", cfg.host, cfg.port);
    let tcp = TcpStream::connect(&addr).map_err(|e| format!("Could not connect to {addr}: {e}"))?;
    tcp.set_read_timeout(Some(Duration::from_secs(30))).ok();
    tcp.set_write_timeout(Some(Duration::from_secs(30))).ok();
    tcp.set_nodelay(true).ok();

    let mut sess = SshSession::new().map_err(|e| format!("Could not create SSH session: {e}"))?;
    sess.set_tcp_stream(
        tcp.try_clone()
            .map_err(|e| format!("TCP clone failed: {e}"))?,
    );
    sess.handshake()
        .map_err(|e| format!("SSH handshake failed: {e}"))?;
    sess.set_keepalive(true, 30);

    match cfg.authType.as_str() {
        "password" => {
            let password = cfg
                .password
                .as_deref()
                .ok_or_else(|| "Password is required for password auth.".to_string())?;
            sess.userauth_password(&cfg.username, password)
                .map_err(|e| format!("Password authentication failed: {e}"))?;
        }
        "privateKey" | "private_key" => {
            let key = cfg
                .privateKeyPem
                .as_deref()
                .ok_or_else(|| "Private key PEM is required for private key auth.".to_string())?;
            crate::ssh_auth::userauth_pubkey_pem(&sess, &cfg.username, key, cfg.password.as_deref())
                .map_err(|e| format!("Private key authentication failed: {e}"))?;
        }
        other => return Err(format!("Unsupported authType: {other}")),
    }

    if !sess.authenticated() {
        return Err("Authentication failed.".into());
    }

    let sftp = sess
        .sftp()
        .map_err(|e| format!("Could not start SFTP subsystem: {e}"))?;
    Ok((tcp, sess, sftp))
}

pub fn connect_ftp(cfg: &RemoteConnectionConfig) -> Result<FtpStream, String> {
    let addr = format!("{}:{}", cfg.host, cfg.port);
    let mut ftp = FtpStream::connect(addr).map_err(|e| format!("FTP connect failed: {e}"))?;
    let pwd = cfg
        .password
        .as_ref()
        .ok_or_else(|| "Password is required for FTP.".to_string())?;
    ftp.login(&cfg.username, pwd)
        .map_err(|e| format!("FTP login failed: {e}"))?;
    Ok(ftp)
}

pub fn io_copy_buffered<R: Read, W: Write>(reader: &mut R, writer: &mut W) -> Result<(), String> {
    let mut buf = vec![0u8; TRANSFER_BUF_SIZE];
    loop {
        let n = reader
            .read(&mut buf)
            .map_err(|e| format!("Read failed: {e}"))?;
        if n == 0 {
            break;
        }
        writer
            .write_all(&buf[..n])
            .map_err(|e| format!("Write failed: {e}"))?;
    }
    Ok(())
}
