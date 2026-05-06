use std::sync::{Arc, Mutex};

use rusqlite::Connection;

pub type DbHandle = Arc<Mutex<Option<Connection>>>;

const INIT_PRAGMAS: &str = "
PRAGMA journal_mode       = WAL;
PRAGMA synchronous        = NORMAL;
PRAGMA temp_store         = MEMORY;
PRAGMA mmap_size          = 2147483648;
PRAGMA cache_size         = -262144;
PRAGMA foreign_keys       = ON;
PRAGMA wal_autocheckpoint = 2000;
PRAGMA busy_timeout       = 5000;
";

pub fn new_handle() -> DbHandle {
    Arc::new(Mutex::new(None))
}

#[derive(Debug, thiserror::Error)]
pub enum DbError {
    #[error("sqlite: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("blocking task panicked")]
    Join,
}

pub async fn init(handle: DbHandle, path: String) -> Result<u32, DbError> {
    let path_for_task = path.clone();
    let (conn, user_version) = tokio::task::spawn_blocking(move || -> Result<_, rusqlite::Error> {
        let conn = Connection::open(&path_for_task)?;
        // execute_batch handles the multi-statement PRAGMA block.
        conn.execute_batch(INIT_PRAGMAS)?;
        let user_version: u32 = conn.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        Ok((conn, user_version))
    })
    .await
    .map_err(|_| DbError::Join)??;

    let mut guard = handle.lock().expect("db mutex poisoned");
    *guard = Some(conn);
    Ok(user_version)
}
