mod framing;

use tokio::io::{AsyncReadExt, BufReader};
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> std::io::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .with_writer(std::io::stderr)
        .init();

    let mut stdout = tokio::io::stdout();
    let ready = br#"{"type":"sidecar.ready"}"#;
    framing::write_frame(&mut stdout, framing::kind::EVENT, ready).await?;

    let stdin = tokio::io::stdin();
    let mut reader = BufReader::new(stdin);
    let mut buf = [0u8; 8192];
    loop {
        let n = reader.read(&mut buf).await?;
        if n == 0 {
            break;
        }
    }

    Ok(())
}
