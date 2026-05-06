use rusqlite::{Connection, OptionalExtension};
use serde_json::{json, Value};

use crate::db::DbHandle;

#[derive(Debug, thiserror::Error)]
pub enum BootstrapError {
    #[error("sqlite: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("blocking task panicked")]
    Join,
}

pub async fn build(db: DbHandle) -> Result<Value, BootstrapError> {
    tokio::task::spawn_blocking(move || -> Result<Value, rusqlite::Error> {
        let guard = db.lock().expect("db poisoned");
        match guard.as_ref() {
            Some(conn) => build_blocking(conn),
            None => Ok(empty_snapshot()),
        }
    })
    .await
    .map_err(|_| BootstrapError::Join)?
    .map_err(BootstrapError::Sqlite)
}

fn empty_snapshot() -> Value {
    json!({
        "workspace": null,
        "context": {},
        "issues": [], "worktrees": [], "prs": [], "comments": [],
        "checks": [], "sessions": [], "ticker": [], "uiState": {},
    })
}

fn build_blocking(conn: &Connection) -> Result<Value, rusqlite::Error> {
    let ws_row: Option<(i64, String, String, Option<String>)> = conn
        .query_row(
            "SELECT id, name, root_path, active_context_json FROM workspace LIMIT 1",
            [],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
        )
        .optional()?;

    let (workspace_id, workspace, context) = match ws_row {
        Some((id, name, root_path, ctx_json)) => {
            let ws = json!({ "id": id, "name": name, "rootPath": root_path });
            let ctx = ctx_json
                .as_deref()
                .and_then(|s| serde_json::from_str::<Value>(s).ok())
                .unwrap_or_else(|| json!({}));
            (Some(id), ws, ctx)
        }
        None => (None, Value::Null, json!({})),
    };

    let (issues, worktrees) = match workspace_id {
        Some(ws_id) => (load_issues(conn, ws_id)?, load_worktrees(conn, ws_id)?),
        None => (vec![], vec![]),
    };

    Ok(json!({
        "workspace": workspace,
        "context": context,
        "issues": issues,
        "worktrees": worktrees,
        "prs": [],
        "comments": [],
        "checks": [],
        "sessions": [],
        "ticker": [],
        "uiState": {},
    }))
}

fn load_issues(conn: &Connection, workspace_id: i64) -> Result<Vec<Value>, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT id, workspace_id, provider_id, external_id, external_key, title, body_md, status,
                status_raw, priority, assignee_external_id, assignee_name, url, hot, archived,
                updated_at_remote, fetched_at
         FROM issue
         WHERE workspace_id = ?1 AND archived = 0",
    )?;
    let rows = stmt.query_map([workspace_id], |r| {
        Ok(json!({
            "id":                 r.get::<_, i64>(0)?,
            "workspaceId":        r.get::<_, i64>(1)?,
            "providerId":         r.get::<_, i64>(2)?,
            "externalId":         r.get::<_, String>(3)?,
            "externalKey":        r.get::<_, Option<String>>(4)?,
            "title":              r.get::<_, String>(5)?,
            "bodyMd":             r.get::<_, Option<String>>(6)?,
            "status":             r.get::<_, String>(7)?,
            "statusRaw":          r.get::<_, Option<String>>(8)?,
            "priority":           r.get::<_, Option<i64>>(9)?,
            "assigneeExternalId": r.get::<_, Option<String>>(10)?,
            "assigneeName":       r.get::<_, Option<String>>(11)?,
            "url":                r.get::<_, Option<String>>(12)?,
            "hot":                r.get::<_, Option<f64>>(13)?,
            "archived":           r.get::<_, i64>(14)? != 0,
            "updatedAtRemote":    r.get::<_, Option<i64>>(15)?,
            "fetchedAt":          r.get::<_, i64>(16)?,
        }))
    })?;
    let mut out = Vec::new();
    for row in rows { out.push(row?); }
    Ok(out)
}

fn load_worktrees(conn: &Connection, workspace_id: i64) -> Result<Vec<Value>, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "SELECT id, workspace_id, issue_id, path, branch, base_branch, base_sha, head_sha,
                ahead, behind, is_active, origin
         FROM worktree
         WHERE workspace_id = ?1 AND removed_at IS NULL",
    )?;
    let rows = stmt.query_map([workspace_id], |r| {
        Ok(json!({
            "id":          r.get::<_, i64>(0)?,
            "workspaceId": r.get::<_, i64>(1)?,
            "issueId":     r.get::<_, Option<i64>>(2)?,
            "path":        r.get::<_, String>(3)?,
            "branch":      r.get::<_, String>(4)?,
            "baseBranch":  r.get::<_, Option<String>>(5)?,
            "baseSha":     r.get::<_, Option<String>>(6)?,
            "headSha":     r.get::<_, Option<String>>(7)?,
            "ahead":       r.get::<_, i64>(8)?,
            "behind":      r.get::<_, i64>(9)?,
            "isActive":    r.get::<_, i64>(10)? != 0,
            "origin":      r.get::<_, String>(11)?,
        }))
    })?;
    let mut out = Vec::new();
    for row in rows { out.push(row?); }
    Ok(out)
}
