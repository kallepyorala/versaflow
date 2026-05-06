mod db;
mod framing;
mod migrations;

use std::time::Instant;

use serde_json::{json, Value};
use tokio::io::{stdin, stdout, BufReader, Stdout};
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> std::io::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .with_writer(std::io::stderr)
        .init();

    let started_at = Instant::now();
    let db = db::new_handle();
    let mut out = stdout();
    framing::write_frame(&mut out, framing::kind::EVENT, br#"{"type":"sidecar.ready"}"#).await?;

    let mut reader = BufReader::new(stdin());

    loop {
        match framing::read_frame(&mut reader).await {
            Ok(Some(frame)) => handle_frame(frame, started_at, db.clone(), &mut out).await?,
            Ok(None) => break,
            Err(err) => {
                tracing::error!(error = ?err, "frame read error; exiting");
                break;
            }
        }
    }

    Ok(())
}

async fn handle_frame(
    frame: framing::Frame,
    started_at: Instant,
    db: db::DbHandle,
    out: &mut Stdout,
) -> std::io::Result<()> {
    if frame.kind != framing::kind::CALL {
        tracing::warn!(kind = frame.kind, "ignoring non-CALL frame");
        return Ok(());
    }

    let req: Value = match serde_json::from_slice(&frame.body) {
        Ok(v) => v,
        Err(err) => {
            tracing::warn!(error = ?err, "malformed CALL body");
            return Ok(());
        }
    };
    let id = req.get("id").cloned().unwrap_or(Value::Null);
    let method = req.get("method").and_then(Value::as_str).unwrap_or("");
    let params = req.get("params").cloned().unwrap_or(Value::Null);

    let response = match method {
        "ping" => {
            let pong = started_at.elapsed().as_millis() as u64;
            json!({ "id": id, "ok": true, "result": { "pong": pong } })
        }
        "vf:init" => handle_init(&id, &params, db).await,
        "vf:ready" => handle_ready(&id, db, out).await?,
        _ => json!({
            "id": id,
            "ok": false,
            "error": {
                "code": "method_not_found",
                "message": format!("no such method: {method}"),
            },
        }),
    };

    let body = serde_json::to_vec(&response)?;
    framing::write_frame(out, framing::kind::RESULT, &body).await?;
    Ok(())
}

async fn handle_ready(id: &Value, _db: db::DbHandle, out: &mut Stdout) -> std::io::Result<Value> {
    // Real workspace seeding lands in #19 — for now emit an empty BOOT so
    // the renderer's decode path is exercised end-to-end.
    let snapshot = json!({
        "workspace": null,
        "context": {},
        "issues": [],
        "worktrees": [],
        "prs": [],
        "comments": [],
        "checks": [],
        "sessions": [],
        "ticker": [],
        "uiState": {},
    });
    match rmp_serde::to_vec_named(&snapshot) {
        Ok(body) => {
            framing::write_frame(out, framing::kind::BOOT, &body).await?;
            tracing::info!(bytes = body.len(), "BOOT emitted");
            Ok(json!({ "id": id, "ok": true, "result": { "ready": true } }))
        }
        Err(err) => {
            tracing::error!(error = ?err, "BOOT msgpack encode failed");
            Ok(json!({
                "id": id,
                "ok": false,
                "error": { "code": "boot_encode_failed", "message": err.to_string() },
            }))
        }
    }
}

async fn handle_init(id: &Value, params: &Value, db: db::DbHandle) -> Value {
    let path = params.get("dbPath").and_then(Value::as_str).unwrap_or("");
    if path.is_empty() {
        return json!({
            "id": id,
            "ok": false,
            "error": { "code": "invalid_params", "message": "missing dbPath" },
        });
    }

    match db::init(db, path.to_string()).await {
        Ok(user_version) => {
            tracing::info!(db_path = %path, user_version, "db opened");
            json!({ "id": id, "ok": true, "result": { "userVersion": user_version } })
        }
        Err(err) => json!({
            "id": id,
            "ok": false,
            "error": { "code": "db_open_failed", "message": err.to_string() },
        }),
    }
}
