mod schema;

use std::path::Path;
use std::sync::Mutex;

use rusqlite::{params, Connection, OptionalExtension};

use crate::error::{CoreError, CoreResult};
use crate::models::{Host, Snippet, SshKey};

pub use schema::migrate;

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn open(path: &Path) -> CoreResult<Self> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| CoreError::Database(e.to_string()))?;
        }
        let conn = Connection::open(path).map_err(|e| CoreError::Database(e.to_string()))?;
        migrate(&conn)?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    #[cfg(test)]
    pub fn open_in_memory() -> CoreResult<Self> {
        let conn = Connection::open_in_memory().map_err(|e| CoreError::Database(e.to_string()))?;
        migrate(&conn)?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    fn with_conn<F, T>(&self, f: F) -> CoreResult<T>
    where
        F: FnOnce(&Connection) -> CoreResult<T>,
    {
        let conn = self.conn.lock().map_err(|e| CoreError::Database(e.to_string()))?;
        f(&conn)
    }

    pub fn is_vault_setup(&self) -> CoreResult<bool> {
        self.with_conn(|conn| {
            let count: i64 = conn
                .query_row("SELECT COUNT(*) FROM vault_meta WHERE id = 1", [], |row| row.get(0))
                .map_err(|e| CoreError::Database(e.to_string()))?;
            Ok(count > 0)
        })
    }

    pub fn load_vault_meta(&self) -> CoreResult<Option<(Vec<u8>, Vec<u8>)>> {
        self.with_conn(|conn| {
            conn.query_row(
                "SELECT salt, verifier FROM vault_meta WHERE id = 1",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .optional()
            .map_err(|e| CoreError::Database(e.to_string()))
        })
    }

    pub fn save_vault_meta(&self, salt: &[u8], verifier: &[u8]) -> CoreResult<()> {
        self.with_conn(|conn| {
            conn.execute(
                "INSERT OR REPLACE INTO vault_meta (id, salt, verifier) VALUES (1, ?1, ?2)",
                params![salt, verifier],
            )
            .map_err(|e| CoreError::Database(e.to_string()))?;
            Ok(())
        })
    }

    pub fn list_hosts(&self) -> CoreResult<Vec<Host>> {
        self.with_conn(|conn| {
            let mut stmt = conn
                .prepare(
                    "SELECT id, name, hostname, port, username, auth_type, credential_ref, private_key_ref, tags, group_name, color, platform, last_connected_at
                     FROM hosts ORDER BY name COLLATE NOCASE",
                )
                .map_err(|e| CoreError::Database(e.to_string()))?;

            let rows = stmt
                .query_map([], map_host_row)
                .map_err(|e| CoreError::Database(e.to_string()))?;

            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| CoreError::Database(e.to_string()))
        })
    }

    pub fn get_host(&self, id: &str) -> CoreResult<Option<Host>> {
        self.with_conn(|conn| {
            conn.query_row(
                "SELECT id, name, hostname, port, username, auth_type, credential_ref, private_key_ref, tags, group_name, color, platform, last_connected_at
                 FROM hosts WHERE id = ?1",
                params![id],
                map_host_row,
            )
            .optional()
            .map_err(|e| CoreError::Database(e.to_string()))
        })
    }

    pub fn upsert_host(&self, host: &Host) -> CoreResult<()> {
        let tags_json =
            serde_json::to_string(&host.tags).map_err(|e| CoreError::Database(e.to_string()))?;
        let host = host.clone();
        self.with_conn(|conn| {
            conn.execute(
                "INSERT INTO hosts (id, name, hostname, port, username, auth_type, credential_ref, private_key_ref, tags, group_name, color, platform, last_connected_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
                 ON CONFLICT(id) DO UPDATE SET
                   name = excluded.name,
                   hostname = excluded.hostname,
                   port = excluded.port,
                   username = excluded.username,
                   auth_type = excluded.auth_type,
                   credential_ref = excluded.credential_ref,
                   private_key_ref = excluded.private_key_ref,
                   tags = excluded.tags,
                   group_name = excluded.group_name,
                   color = excluded.color,
                   platform = COALESCE(excluded.platform, hosts.platform),
                   last_connected_at = excluded.last_connected_at",
                params![
                    host.id,
                    host.name,
                    host.hostname,
                    host.port,
                    host.username,
                    host.auth_type,
                    host.credential_ref,
                    host.private_key_ref,
                    tags_json,
                    host.group,
                    host.color,
                    host.platform,
                    host.last_connected_at,
                ],
            )
            .map_err(|e| CoreError::Database(e.to_string()))?;
            Ok(())
        })
    }

    pub fn delete_host(&self, id: &str) -> CoreResult<()> {
        self.with_conn(|conn| {
            conn.execute("DELETE FROM hosts WHERE id = ?1", params![id])
                .map_err(|e| CoreError::Database(e.to_string()))?;
            Ok(())
        })
    }

    pub fn upsert_credential(&self, ref_id: &str, blob: &[u8]) -> CoreResult<()> {
        self.with_conn(|conn| {
            conn.execute(
                "INSERT INTO credentials (ref_id, blob) VALUES (?1, ?2)
                 ON CONFLICT(ref_id) DO UPDATE SET blob = excluded.blob",
                params![ref_id, blob],
            )
            .map_err(|e| CoreError::Database(e.to_string()))?;
            Ok(())
        })
    }

    pub fn load_credential(&self, ref_id: &str) -> CoreResult<Option<Vec<u8>>> {
        self.with_conn(|conn| {
            conn.query_row(
                "SELECT blob FROM credentials WHERE ref_id = ?1",
                params![ref_id],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| CoreError::Database(e.to_string()))
        })
    }

    pub fn delete_credential(&self, ref_id: &str) -> CoreResult<()> {
        self.with_conn(|conn| {
            conn.execute("DELETE FROM credentials WHERE ref_id = ?1", params![ref_id])
                .map_err(|e| CoreError::Database(e.to_string()))?;
            Ok(())
        })
    }

    pub fn list_snippets(&self) -> CoreResult<Vec<Snippet>> {
        self.with_conn(|conn| {
            let mut stmt = conn
                .prepare("SELECT id, title, body, tags FROM snippets ORDER BY title COLLATE NOCASE")
                .map_err(|e| CoreError::Database(e.to_string()))?;

            let rows = stmt
                .query_map([], map_snippet_row)
                .map_err(|e| CoreError::Database(e.to_string()))?;

            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| CoreError::Database(e.to_string()))
        })
    }

    pub fn upsert_snippet(&self, snippet: &Snippet) -> CoreResult<()> {
        let tags_json =
            serde_json::to_string(&snippet.tags).map_err(|e| CoreError::Database(e.to_string()))?;
        self.with_conn(|conn| {
            conn.execute(
                "INSERT INTO snippets (id, title, body, tags) VALUES (?1, ?2, ?3, ?4)
                 ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, tags = excluded.tags, updated_at = datetime('now')",
                params![snippet.id, snippet.title, snippet.body, tags_json],
            )
            .map_err(|e| CoreError::Database(e.to_string()))?;
            Ok(())
        })
    }

    pub fn list_ssh_keys(&self) -> CoreResult<Vec<SshKey>> {
        self.with_conn(|conn| {
            let mut stmt = conn
                .prepare("SELECT id, name, ref_id, tags FROM ssh_keys ORDER BY name COLLATE NOCASE")
                .map_err(|e| CoreError::Database(e.to_string()))?;

            let rows = stmt
                .query_map([], map_ssh_key_row)
                .map_err(|e| CoreError::Database(e.to_string()))?;

            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| CoreError::Database(e.to_string()))
        })
    }

    pub fn upsert_ssh_key(&self, key: &SshKey) -> CoreResult<()> {
        let tags_json =
            serde_json::to_string(&key.tags).map_err(|e| CoreError::Database(e.to_string()))?;
        self.with_conn(|conn| {
            conn.execute(
                "INSERT INTO ssh_keys (id, name, ref_id, tags) VALUES (?1, ?2, ?3, ?4)
                 ON CONFLICT(id) DO UPDATE SET name = excluded.name, tags = excluded.tags, updated_at = datetime('now')",
                params![key.id, key.name, key.ref_id, tags_json],
            )
            .map_err(|e| CoreError::Database(e.to_string()))?;
            Ok(())
        })
    }

    pub fn upsert_vault_record(&self, record_id: &str, blob: &[u8]) -> CoreResult<()> {
        self.with_conn(|conn| {
            conn.execute(
                "INSERT INTO vault_records (record_id, blob, updated_at) VALUES (?1, ?2, datetime('now'))
                 ON CONFLICT(record_id) DO UPDATE SET blob = excluded.blob, updated_at = datetime('now')",
                params![record_id, blob],
            )
            .map_err(|e| CoreError::Database(e.to_string()))?;
            Ok(())
        })
    }

    pub fn load_vault_record(&self, record_id: &str) -> CoreResult<Option<Vec<u8>>> {
        self.with_conn(|conn| {
            conn.query_row(
                "SELECT blob FROM vault_records WHERE record_id = ?1",
                params![record_id],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| CoreError::Database(e.to_string()))
        })
    }

    pub fn delete_vault_record(&self, record_id: &str) -> CoreResult<()> {
        self.with_conn(|conn| {
            conn.execute("DELETE FROM vault_records WHERE record_id = ?1", params![record_id])
                .map_err(|e| CoreError::Database(e.to_string()))?;
            Ok(())
        })
    }

    /// Remove legacy plaintext rows after encrypted bundle migration.
    pub fn clear_plaintext_vault_data(&self) -> CoreResult<()> {
        self.with_conn(|conn| {
            conn.execute_batch(
                "DELETE FROM hosts;
                 DELETE FROM snippets;
                 DELETE FROM ssh_keys;
                 DELETE FROM credentials;",
            )
            .map_err(|e| CoreError::Database(e.to_string()))?;
            Ok(())
        })
    }
}

fn map_host_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Host> {
    let tags_json: String = row.get(8)?;
    let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
    Ok(Host {
        id: row.get(0)?,
        name: row.get(1)?,
        hostname: row.get(2)?,
        port: row.get(3)?,
        username: row.get(4)?,
        auth_type: row.get(5)?,
        credential_ref: row.get(6)?,
        private_key_ref: row.get(7)?,
        tags,
        group: row.get(9)?,
        color: row.get(10)?,
        platform: row.get(11)?,
        last_connected_at: row.get(12)?,
    })
}

fn map_snippet_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Snippet> {
    let tags_json: String = row.get(3)?;
    let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
    Ok(Snippet {
        id: row.get(0)?,
        title: row.get(1)?,
        body: row.get(2)?,
        tags,
    })
}

fn map_ssh_key_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<SshKey> {
    let tags_json: String = row.get(3)?;
    let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
    Ok(SshKey {
        id: row.get(0)?,
        name: row.get(1)?,
        ref_id: row.get(2)?,
        tags,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::Host;

    fn sample_host(id: &str, name: &str) -> Host {
        Host {
            id: id.into(),
            name: name.into(),
            hostname: "example.com".into(),
            port: 22,
            username: "deploy".into(),
            auth_type: "password".into(),
            credential_ref: None,
            private_key_ref: None,
            tags: vec!["prod".into()],
            group: None,
            color: None,
            platform: Some("linux".into()),
            last_connected_at: None,
        }
    }

    #[test]
    fn host_crud_roundtrip() {
        let db = Database::open_in_memory().expect("db");
        db.upsert_host(&sample_host("h1", "Production")).expect("insert");
        let list = db.list_hosts().expect("list");
        assert_eq!(list.len(), 1);
        db.delete_host("h1").expect("delete");
        assert!(db.list_hosts().expect("list").is_empty());
    }
}
