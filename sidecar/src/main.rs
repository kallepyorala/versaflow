mod framing;

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
    let mut out = stdout();
    framing::write_frame(&mut out, framing::kind::EVENT, br#"{"type":"sidecar.ready"}"#).await?;

    let mut reader = BufReader::new(stdin());

    loop {
        match framing::read_frame(&mut reader).await {
            Ok(Some(frame)) => handle_frame(frame, started_at, &mut out).await?,
            Ok(None) => break,
            Err(err) => {
                tracing::error!(error = ?err, "frame read error; exiting");
                break;
            }
        }
    }

    Ok(())
}

async fn handle_frame(frame: framing::Frame, started_at: Instant, out: &mut Stdout) -> std::io::Result<()> {
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

    let response = match method {
        "ping" => {
            let pong = started_at.elapsed().as_millis() as u64;
            json!({ "id": id, "ok": true, "result": { "pong": pong } })
        }
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
