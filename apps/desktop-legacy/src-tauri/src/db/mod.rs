mod schema;

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Mutex;

pub use schema::migrate;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HostRecord {
    pub id: String,
    pub name: String,
    pub hostname: String,
    pub port: u16,
    pub username: String,
    pub auth_type: String,
    pub credential_ref: Option<String>,
    pub private_key_ref: Option<String>,
    pub tags: Vec<String>,
    pub group: Option<String>,
    pub color: Option<String>,
    pub platform: Option<String>,
    pub last_connected_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnippetRecord {
    pub id: String,
    pub title: String,
    pub body: String,
    pub tags: Vec<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SshKeyRecord {
    pub id: String,
    pub name: String,
    pub ref_id: String,
    pub tags: Vec<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn open(path: &Path) -> Result<Self, String> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Veri dizini oluşturulamadı: {e}"))?;
        }
        let conn = Connection::open(path).map_err(|e| format!("Veritabanı açılamadı: {e}"))?;
        migrate(&conn)?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    #[cfg(test)]
    pub fn open_in_memory() -> Result<Self, String> {
        let conn = Connection::open_in_memory().map_err(|e| e.to_string())?;
        migrate(&conn)?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    fn with_conn<F, T>(&self, f: F) -> Result<T, String>
    where
        F: FnOnce(&Connection) -> Result<T, String>,
    {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        f(&conn)
    }

    pub fn is_vault_setup(&self) -> Result<bool, String> {
        self.with_conn(|conn| {
            let count: i64 = conn
                .query_row("SELECT COUNT(*) FROM vault_meta WHERE id = 1", [], |row| {
                    row.get(0)
                })
                .map_err(|e| e.to_string())?;
            Ok(count > 0)
        })
    }

    pub fn load_vault_meta(&self) -> Result<Option<(Vec<u8>, Vec<u8>)>, String> {
        self.with_conn(|conn| {
            conn.query_row(
                "SELECT salt, verifier FROM vault_meta WHERE id = 1",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .optional()
            .map_err(|e| e.to_string())
        })
    }

    pub fn save_vault_meta(&self, salt: &[u8], verifier: &[u8]) -> Result<(), String> {
        self.with_conn(|conn| {
            conn.execute(
                "INSERT OR REPLACE INTO vault_meta (id, salt, verifier) VALUES (1, ?1, ?2)",
                params![salt, verifier],
            )
            .map_err(|e| e.to_string())?;
            Ok(())
        })
    }

    pub fn get_host(&self, id: &str) -> Result<Option<HostRecord>, String> {
        self.with_conn(|conn| {
            conn.query_row(
                "SELECT id, name, hostname, port, username, auth_type, credential_ref, private_key_ref, tags, group_name, color, platform, last_connected_at
                 FROM hosts WHERE id = ?1",
                params![id],
                map_host_row,
            )
            .optional()
            .map_err(|e| e.to_string())
        })
    }

    pub fn list_hosts(&self) -> Result<Vec<HostRecord>, String> {
        self.with_conn(|conn| {
            let mut stmt = conn
                .prepare(
                    "SELECT id, name, hostname, port, username, auth_type, credential_ref, private_key_ref, tags, group_name, color, platform, last_connected_at
                     FROM hosts ORDER BY name COLLATE NOCASE",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map([], map_host_row)
                .map_err(|e| e.to_string())?;

            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())
        })
    }

    pub fn upsert_host(&self, host: &HostRecord) -> Result<(), String> {
        let tags_json =
            serde_json::to_string(&host.tags).map_err(|e| format!("Tag serileştirme: {e}"))?;
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
            .map_err(|e| e.to_string())?;
            Ok(())
        })
    }

    pub fn delete_host(
        &self,
        id: &str,
    ) -> Result<Option<(Option<String>, Option<String>)>, String> {
        self.with_conn(|conn| {
            let refs: Option<(Option<String>, Option<String>)> = conn
                .query_row(
                    "SELECT credential_ref, private_key_ref FROM hosts WHERE id = ?1",
                    params![id],
                    |row| Ok((row.get(0)?, row.get(1)?)),
                )
                .optional()
                .map_err(|e| e.to_string())?;

            conn.execute("DELETE FROM hosts WHERE id = ?1", params![id])
                .map_err(|e| e.to_string())?;

            Ok(refs)
        })
    }

    pub fn upsert_credential(&self, ref_id: &str, blob: &[u8]) -> Result<(), String> {
        self.with_conn(|conn| {
            conn.execute(
                "INSERT INTO credentials (ref_id, blob) VALUES (?1, ?2)
                 ON CONFLICT(ref_id) DO UPDATE SET blob = excluded.blob",
                params![ref_id, blob],
            )
            .map_err(|e| e.to_string())?;
            Ok(())
        })
    }

    pub fn delete_credential(&self, ref_id: &str) -> Result<(), String> {
        self.with_conn(|conn| {
            conn.execute("DELETE FROM credentials WHERE ref_id = ?1", params![ref_id])
                .map_err(|e| e.to_string())?;
            Ok(())
        })
    }

    pub fn touch_host_connected(&self, id: &str) -> Result<(), String> {
        self.with_conn(|conn| {
            conn.execute(
                "UPDATE hosts SET last_connected_at = datetime('now') WHERE id = ?1",
                params![id],
            )
            .map_err(|e| e.to_string())?;
            Ok(())
        })
    }

    pub fn load_credential(&self, ref_id: &str) -> Result<Option<Vec<u8>>, String> {
        self.with_conn(|conn| {
            conn.query_row(
                "SELECT blob FROM credentials WHERE ref_id = ?1",
                params![ref_id],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| e.to_string())
        })
    }

    pub fn set_host_platform(&self, id: &str, platform: &str) -> Result<(), String> {
        self.with_conn(|conn| {
            conn.execute(
                "UPDATE hosts SET platform = ?1 WHERE id = ?2",
                params![platform, id],
            )
            .map_err(|e| e.to_string())?;
            Ok(())
        })
    }

    pub fn list_snippets(&self) -> Result<Vec<SnippetRecord>, String> {
        self.with_conn(|conn| {
            let mut stmt = conn
                .prepare(
                    "SELECT id, title, body, tags, created_at, updated_at
                     FROM snippets
                     ORDER BY updated_at DESC, title COLLATE NOCASE",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map([], map_snippet_row)
                .map_err(|e| e.to_string())?;

            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())
        })
    }

    pub fn upsert_snippet(&self, snippet: &SnippetRecord) -> Result<(), String> {
        let tags_json =
            serde_json::to_string(&snippet.tags).map_err(|e| format!("Tag serialization: {e}"))?;
        let snippet = snippet.clone();
        self.with_conn(|conn| {
            conn.execute(
                "INSERT INTO snippets (id, title, body, tags)
                 VALUES (?1, ?2, ?3, ?4)
                 ON CONFLICT(id) DO UPDATE SET
                   title = excluded.title,
                   body = excluded.body,
                   tags = excluded.tags,
                   updated_at = datetime('now')",
                params![snippet.id, snippet.title, snippet.body, tags_json],
            )
            .map_err(|e| e.to_string())?;
            Ok(())
        })
    }

    pub fn delete_snippet(&self, id: &str) -> Result<(), String> {
        self.with_conn(|conn| {
            conn.execute("DELETE FROM snippets WHERE id = ?1", params![id])
                .map_err(|e| e.to_string())?;
            Ok(())
        })
    }

    pub fn list_ssh_keys(&self) -> Result<Vec<SshKeyRecord>, String> {
        self.with_conn(|conn| {
            let mut stmt = conn
                .prepare(
                    "SELECT id, name, ref_id, tags, created_at, updated_at
                     FROM ssh_keys
                     ORDER BY updated_at DESC, name COLLATE NOCASE",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map([], map_ssh_key_row)
                .map_err(|e| e.to_string())?;

            rows.collect::<Result<Vec<_>, _>>()
                .map_err(|e| e.to_string())
        })
    }

    pub fn get_ssh_key(&self, id: &str) -> Result<Option<SshKeyRecord>, String> {
        self.with_conn(|conn| {
            conn.query_row(
                "SELECT id, name, ref_id, tags, created_at, updated_at
                 FROM ssh_keys WHERE id = ?1",
                params![id],
                map_ssh_key_row,
            )
            .optional()
            .map_err(|e| e.to_string())
        })
    }

    pub fn upsert_ssh_key(&self, key: &SshKeyRecord) -> Result<(), String> {
        let tags_json =
            serde_json::to_string(&key.tags).map_err(|e| format!("Tag serialization: {e}"))?;
        let key = key.clone();
        self.with_conn(|conn| {
            conn.execute(
                "INSERT INTO ssh_keys (id, name, ref_id, tags)
                 VALUES (?1, ?2, ?3, ?4)
                 ON CONFLICT(id) DO UPDATE SET
                   name = excluded.name,
                   tags = excluded.tags,
                   updated_at = datetime('now')",
                params![key.id, key.name, key.ref_id, tags_json],
            )
            .map_err(|e| e.to_string())?;
            Ok(())
        })
    }

    pub fn delete_ssh_key(&self, id: &str) -> Result<Option<String>, String> {
        self.with_conn(|conn| {
            let ref_id: Option<String> = conn
                .query_row(
                    "SELECT ref_id FROM ssh_keys WHERE id = ?1",
                    params![id],
                    |row| row.get(0),
                )
                .optional()
                .map_err(|e| e.to_string())?;

            conn.execute("DELETE FROM ssh_keys WHERE id = ?1", params![id])
                .map_err(|e| e.to_string())?;

            Ok(ref_id)
        })
    }

    pub fn get_sync_meta(&self, key: &str) -> Result<String, String> {
        self.with_conn(|conn| {
            conn.query_row(
                "SELECT value FROM sync_meta WHERE key = ?1",
                params![key],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())
        })
    }

    pub fn set_sync_meta(&self, key: &str, value: &str) -> Result<(), String> {
        self.with_conn(|conn| {
            conn.execute(
                "INSERT INTO sync_meta(key, value) VALUES(?1, ?2)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                params![key, value],
            )
            .map_err(|e| e.to_string())?;
            Ok(())
        })
    }

    pub fn seed_default_snippets(&self) -> Result<(), String> {
        if self.list_snippets()?.len() > 0 {
            return Ok(());
        }
        let defaults: Vec<SnippetRecord> = vec![
            SnippetRecord {
                id: "seed-sys-info".into(),
                title: "System info".into(),
                body: "uname -a\necho '---'\ndf -h\necho '---'\nfree -h 2>/dev/null || vm_stat".into(),
                tags: vec!["system".into()],
                created_at: None,
                updated_at: None,
            },
            SnippetRecord {
                id: "seed-disk-usage".into(),
                title: "Disk usage (top 10)".into(),
                body: "du -sh /* 2>/dev/null | sort -rh | head -10".into(),
                tags: vec!["system".into(), "disk".into()],
                created_at: None,
                updated_at: None,
            },
            SnippetRecord {
                id: "seed-ports".into(),
                title: "Listening ports".into(),
                body: "ss -tlnp 2>/dev/null || netstat -an | grep LISTEN".into(),
                tags: vec!["network".into(), "system".into()],
                created_at: None,
                updated_at: None,
            },
            SnippetRecord {
                id: "seed-docker-ps".into(),
                title: "Docker containers".into(),
                body: "docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'".into(),
                tags: vec!["docker".into()],
                created_at: None,
                updated_at: None,
            },
            SnippetRecord {
                id: "seed-docker-clean".into(),
                title: "Docker cleanup".into(),
                body: "docker system prune -af --volumes".into(),
                tags: vec!["docker".into()],
                created_at: None,
                updated_at: None,
            },
            SnippetRecord {
                id: "seed-git-log".into(),
                title: "Git log (compact)".into(),
                body: "git log --oneline --graph --decorate --all -20".into(),
                tags: vec!["git".into()],
                created_at: None,
                updated_at: None,
            },
            SnippetRecord {
                id: "seed-ps".into(),
                title: "Top processes (CPU)".into(),
                body: "ps aux --sort=-%cpu | head -10".into(),
                tags: vec!["system".into()],
                created_at: None,
                updated_at: None,
            },
            SnippetRecord {
                id: "seed-nginx".into(),
                title: "Nginx reload".into(),
                body: "sudo nginx -t && sudo systemctl reload nginx".into(),
                tags: vec!["nginx".into(), "ops".into()],
                created_at: None,
                updated_at: None,
            },
            SnippetRecord {
                id: "seed-cert".into(),
                title: "SSL cert check".into(),
                body: "echo | openssl s_client -servername example.com -connect example.com:443 2>/dev/null | openssl x509 -noout -dates".into(),
                tags: vec!["ssl".into(), "ops".into()],
                created_at: None,
                updated_at: None,
            },
            SnippetRecord {
                id: "seed-journal".into(),
                title: "Journal errors (last hour)".into(),
                body: "journalctl --since '1 hour ago' -p err --no-pager".into(),
                tags: vec!["system".into(), "logs".into()],
                created_at: None,
                updated_at: None,
            },
        ];
        for s in &defaults {
            self.upsert_snippet(s)?;
        }
        Ok(())
    }
}

fn map_host_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<HostRecord> {
    let tags_json: String = row.get(8)?;
    let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
    Ok(HostRecord {
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

fn map_snippet_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<SnippetRecord> {
    let tags_json: String = row.get(3)?;
    let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
    Ok(SnippetRecord {
        id: row.get(0)?,
        title: row.get(1)?,
        body: row.get(2)?,
        tags,
        created_at: row.get(4)?,
        updated_at: row.get(5)?,
    })
}

fn map_ssh_key_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<SshKeyRecord> {
    let tags_json: String = row.get(3)?;
    let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
    Ok(SshKeyRecord {
        id: row.get(0)?,
        name: row.get(1)?,
        ref_id: row.get(2)?,
        tags,
        created_at: row.get(4)?,
        updated_at: row.get(5)?,
    })
}

trait OptionalExt<T> {
    fn optional(self) -> Result<Option<T>, rusqlite::Error>;
}

impl<T> OptionalExt<T> for Result<T, rusqlite::Error> {
    fn optional(self) -> Result<Option<T>, rusqlite::Error> {
        match self {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(err) => Err(err),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_host(id: &str, name: &str) -> HostRecord {
        HostRecord {
            id: id.into(),
            name: name.into(),
            hostname: "example.com".into(),
            port: 22,
            username: "deploy".into(),
            auth_type: "password".into(),
            credential_ref: Some("cred-1".into()),
            private_key_ref: None,
            tags: vec!["prod".into()],
            group: Some("servers".into()),
            color: Some("#22c55e".into()),
            platform: Some("linux".into()),
            last_connected_at: None,
        }
    }

    #[test]
    fn host_crud_roundtrip() {
        let db = Database::open_in_memory().expect("db");
        let host = sample_host("h1", "Production");
        db.upsert_host(&host).expect("insert");
        let list = db.list_hosts().expect("list");
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].name, "Production");

        let mut updated = host.clone();
        updated.name = "Prod".into();
        db.upsert_host(&updated).expect("update");
        let list = db.list_hosts().expect("list");
        assert_eq!(list[0].name, "Prod");

        let refs = db.delete_host("h1").expect("delete");
        assert!(refs.is_some());
        assert!(db.list_hosts().expect("list").is_empty());
    }

    fn sample_snippet(id: &str, title: &str) -> SnippetRecord {
        SnippetRecord {
            id: id.into(),
            title: title.into(),
            body: "echo hello".into(),
            tags: vec!["ops".into()],
            created_at: None,
            updated_at: None,
        }
    }

    #[test]
    fn snippet_crud_roundtrip() {
        let db = Database::open_in_memory().expect("db");

        let s1 = sample_snippet("s1", "Deploy");
        db.upsert_snippet(&s1).expect("insert");
        let list = db.list_snippets().expect("list");
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].title, "Deploy");

        let mut updated = s1.clone();
        updated.body = "echo updated".into();
        db.upsert_snippet(&updated).expect("update");
        let list = db.list_snippets().expect("list");
        assert_eq!(list[0].body, "echo updated");

        db.delete_snippet("s1").expect("delete");
        assert!(db.list_snippets().expect("list").is_empty());
    }

    fn sample_key(id: &str, name: &str) -> SshKeyRecord {
        SshKeyRecord {
            id: id.into(),
            name: name.into(),
            ref_id: format!("key-global-{id}"),
            tags: vec!["prod".into()],
            created_at: None,
            updated_at: None,
        }
    }

    #[test]
    fn ssh_key_crud_roundtrip() {
        let db = Database::open_in_memory().expect("db");

        let k1 = sample_key("k1", "Prod key");
        db.upsert_ssh_key(&k1).expect("insert");
        let list = db.list_ssh_keys().expect("list");
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].name, "Prod key");

        let mut updated = k1.clone();
        updated.name = "Prod key 2".into();
        db.upsert_ssh_key(&updated).expect("update");
        let list = db.list_ssh_keys().expect("list");
        assert_eq!(list[0].name, "Prod key 2");

        let ref_id = db.delete_ssh_key("k1").expect("delete");
        assert_eq!(ref_id.as_deref(), Some("key-global-k1"));
        assert!(db.list_ssh_keys().expect("list").is_empty());
    }
}
