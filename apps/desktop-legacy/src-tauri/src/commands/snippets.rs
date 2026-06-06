use crate::db::{Database, SnippetRecord};
use crate::error::AppError;
use serde::Deserialize;
use tauri::State;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveSnippetPayload {
    pub id: Option<String>,
    pub title: String,
    pub body: String,
    pub tags: Vec<String>,
}

#[tauri::command]
pub fn snippets_list(db: State<'_, Database>) -> Result<Vec<SnippetRecord>, AppError> {
    db.list_snippets().map_err(AppError::database)
}

#[tauri::command]
pub fn snippets_save(
    payload: SaveSnippetPayload,
    db: State<'_, Database>,
) -> Result<SnippetRecord, AppError> {
    let id = payload
        .id
        .clone()
        .unwrap_or_else(|| Uuid::new_v4().to_string());

    if payload.title.trim().is_empty() {
        return Err(AppError::snippet_title_required());
    }
    if payload.body.trim().is_empty() {
        return Err(AppError::snippet_body_required());
    }

    let snippet = SnippetRecord {
        id: id.clone(),
        title: payload.title.trim().to_string(),
        body: payload.body,
        tags: payload.tags,
        created_at: None,
        updated_at: None,
    };

    db.upsert_snippet(&snippet).map_err(AppError::database)?;
    db.list_snippets()
        .map_err(AppError::database)?
        .into_iter()
        .find(|s| s.id == id)
        .ok_or_else(AppError::snippet_not_found)
}

#[tauri::command]
pub fn snippets_delete(id: String, db: State<'_, Database>) -> Result<(), AppError> {
    db.delete_snippet(&id).map_err(AppError::database)
}
