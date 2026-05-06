use tokio::io::{self, AsyncReadExt, AsyncWriteExt};

pub const MAX_FRAME_BYTES: usize = 16 * 1024 * 1024;

#[allow(dead_code)]
pub mod kind {
    pub const BOOT: u8 = 0;
    pub const DELTA: u8 = 1;
    pub const CALL: u8 = 2;
    pub const RESULT: u8 = 3;
    pub const EVENT: u8 = 4;
}

#[derive(Debug)]
#[allow(dead_code)]
pub struct Frame {
    pub kind: u8,
    pub body: Vec<u8>,
}

#[allow(dead_code)]
pub async fn read_frame<R: AsyncReadExt + Unpin>(reader: &mut R) -> io::Result<Option<Frame>> {
    let mut header = [0u8; 5];
    match reader.read_exact(&mut header).await {
        Ok(_) => {}
        Err(e) if e.kind() == io::ErrorKind::UnexpectedEof => return Ok(None),
        Err(e) => return Err(e),
    }
    let kind = header[0];
    let len = u32::from_be_bytes([header[1], header[2], header[3], header[4]]) as usize;
    if len > MAX_FRAME_BYTES {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            format!("frame body {len} exceeds {MAX_FRAME_BYTES}"),
        ));
    }
    let mut body = vec![0u8; len];
    reader.read_exact(&mut body).await?;
    Ok(Some(Frame { kind, body }))
}

pub async fn write_frame<W: AsyncWriteExt + Unpin>(
    writer: &mut W,
    kind: u8,
    body: &[u8],
) -> io::Result<()> {
    if body.len() > MAX_FRAME_BYTES {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            format!("frame body {} exceeds {MAX_FRAME_BYTES}", body.len()),
        ));
    }
    let mut header = [0u8; 5];
    header[0] = kind;
    header[1..5].copy_from_slice(&(body.len() as u32).to_be_bytes());
    writer.write_all(&header).await?;
    writer.write_all(body).await?;
    writer.flush().await?;
    Ok(())
}
