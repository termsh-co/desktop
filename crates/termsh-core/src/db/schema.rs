use rusqlite::Connection;

use crate::error::{CoreError, CoreResult};

const SCHEMA_VERSION: i64 = 2;

pub fn migrate(conn: &Connection) -> CoreResult<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );",
    )
    .map_err(|e| CoreError::Database(e.to_string()))?;

    let version: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if version < 1 {
        migrate_v1(conn)?;
        record_migration(conn, 1)?;
    }
    if version < 2 {
        migrate_v2(conn)?;
        record_migration(conn, 2)?;
    }

    Ok(())
}

fn record_migration(conn: &Connection, version: i64) -> CoreResult<()> {
    conn.execute(
        "INSERT OR IGNORE INTO schema_migrations (version) VALUES (?1)",
        rusqlite::params![version],
    )
    .map_err(|e| CoreError::Database(e.to_string()))?;
    Ok(())
}

fn migrate_v1(conn: &Connection) -> CoreResult<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS vault_meta (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            salt BLOB NOT NULL,
            verifier BLOB NOT NULL
        );

        CREATE TABLE IF NOT EXISTS credentials (
            ref_id TEXT PRIMARY KEY,
            blob BLOB NOT NULL
        );

        CREATE TABLE IF NOT EXISTS hosts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            hostname TEXT NOT NULL,
            port INTEGER NOT NULL DEFAULT 22,
            username TEXT NOT NULL,
            auth_type TEXT NOT NULL,
            credential_ref TEXT,
            private_key_ref TEXT,
            tags TEXT NOT NULL DEFAULT '[]',
            group_name TEXT,
            color TEXT,
            platform TEXT,
            last_connected_at TEXT
        );

        CREATE TABLE IF NOT EXISTS snippets (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            tags TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS ssh_keys (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            ref_id TEXT NOT NULL,
            tags TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS sync_meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        ",
    )
    .map_err(|e| CoreError::Database(e.to_string()))?;
    Ok(())
}

fn migrate_v2(conn: &Connection) -> CoreResult<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS vault_records (
            record_id TEXT PRIMARY KEY,
            blob BLOB NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        ",
    )
    .map_err(|e| CoreError::Database(e.to_string()))?;
    Ok(())
}

pub fn schema_version() -> i64 {
    SCHEMA_VERSION
}
