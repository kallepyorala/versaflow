use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{Connection, params};

pub const MIGRATIONS: &[&str] = &[
    // 0001 — providers, workspaces, status_map, issue + FTS5
    include_str!("../migrations/0001_core.sql"),
    // 0002 — worktree, pr, issue_pr, comment, pr_check, diff_file
    include_str!("../migrations/0002_worktree_pr_comment.sql"),
];

#[derive(Debug, thiserror::Error)]
pub enum MigrationError {
    #[error("sqlite (migration {index}): {source}")]
    Sqlite {
        index: usize,
        #[source]
        source: rusqlite::Error,
    },
    #[error("sqlite: {0}")]
    Plain(#[from] rusqlite::Error),
}

pub fn run(conn: &mut Connection) -> Result<(), MigrationError> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS _migration (
             id          INTEGER PRIMARY KEY,
             applied_at  INTEGER NOT NULL
         )",
    )?;

    let max_applied: Option<i64> = conn
        .query_row("SELECT MAX(id) FROM _migration", [], |row| row.get(0))?;
    let already_applied = max_applied.unwrap_or(0) as usize;

    let total = MIGRATIONS.len();
    if already_applied >= total {
        tracing::info!(at = already_applied, "migrations: up to date");
        return Ok(());
    }

    let first = already_applied + 1;
    for (offset, script) in MIGRATIONS[already_applied..].iter().enumerate() {
        let index = already_applied + offset + 1;
        apply_one(conn, index, script)?;
    }

    tracing::info!(from = first, to = total, "migrations: applied");
    Ok(())
}

fn apply_one(conn: &mut Connection, index: usize, script: &str) -> Result<(), MigrationError> {
    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0);

    let tx = conn
        .transaction()
        .map_err(|e| MigrationError::Sqlite { index, source: e })?;
    tx.execute_batch(script)
        .map_err(|e| MigrationError::Sqlite { index, source: e })?;
    tx.execute(
        "INSERT INTO _migration (id, applied_at) VALUES (?1, ?2)",
        params![index as i64, now_ms],
    )
    .map_err(|e| MigrationError::Sqlite { index, source: e })?;
    tx.execute_batch(&format!("PRAGMA user_version = {index}"))
        .map_err(|e| MigrationError::Sqlite { index, source: e })?;
    tx.commit()
        .map_err(|e| MigrationError::Sqlite { index, source: e })?;
    Ok(())
}
