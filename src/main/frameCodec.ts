import { EventEmitter } from 'events';

export const MAX_FRAME_BYTES = 16 * 1024 * 1024;
const HEADER_BYTES = 5;

export const FrameKind = {
  BOOT: 0,
  DELTA: 1,
  CALL: 2,
  RESULT: 3,
  EVENT: 4,
} as const;

export interface DecodedFrame {
  kind: number;
  body: Buffer;
}

export class FrameCodec extends EventEmitter {
  private buf: Buffer = Buffer.alloc(0);
  private closed = false;

  push(chunk: Buffer): void {
    if (this.closed) return;
    this.buf = this.buf.length === 0 ? chunk : Buffer.concat([this.buf, chunk]);

    while (this.buf.length >= HEADER_BYTES) {
      const kind = this.buf.readUInt8(0);
      const len = this.buf.readUInt32BE(1);
      if (len > MAX_FRAME_BYTES) {
        this.fail(new Error(`frame body ${len} exceeds ${MAX_FRAME_BYTES}`));
        return;
      }
      const total = HEADER_BYTES + len;
      if (this.buf.length < total) return;
      const body = this.buf.subarray(HEADER_BYTES, total);
      // Copy so consumers can hold onto it past the next push().
      const frame: DecodedFrame = { kind, body: Buffer.from(body) };
      this.buf = this.buf.subarray(total);
      this.emit('frame', frame);
    }
  }

  static encode(kind: number, body: Buffer): Buffer {
    if (body.length > MAX_FRAME_BYTES) {
      throw new Error(`frame body ${body.length} exceeds ${MAX_FRAME_BYTES}`);
    }
    const out = Buffer.alloc(HEADER_BYTES + body.length);
    out.writeUInt8(kind, 0);
    out.writeUInt32BE(body.length, 1);
    body.copy(out, HEADER_BYTES);
    return out;
  }

  reset(): void {
    this.buf = Buffer.alloc(0);
    this.closed = false;
  }

  private fail(err: Error): void {
    this.closed = true;
    this.buf = Buffer.alloc(0);
    this.emit('error', err);
  }
}
