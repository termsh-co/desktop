mod emit;
mod local;
mod manager;
mod os_detect;
mod ssh;
pub mod types;

pub use manager::{
    close_session, spawn_local_shell, spawn_ssh_shell, terminal_resize, terminal_write,
    SessionManager,
};
