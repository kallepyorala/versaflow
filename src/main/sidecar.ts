import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { app } from 'electron';
import { EventEmitter } from 'events';
import { join } from 'path';
import { FrameCodec, type DecodedFrame } from './frameCodec';

const BACKOFF_STEPS_MS = [1000, 2000, 4000, 8000];
const HEALTHY_RESET_MS = 60_000;
const SHUTDOWN_TIMEOUT_MS = 2000;

function resolveBinaryPath(): string {
  const exe = process.platform === 'win32' ? 'vf-sidecar.exe' : 'vf-sidecar';
  if (app.isPackaged) {
    return join(process.resourcesPath, exe);
  }
  return join(__dirname, '..', '..', 'sidecar', 'target', 'release', exe);
}

export class SidecarManager extends EventEmitter {
  private child: ChildProcessWithoutNullStreams | null = null;
  private shuttingDown = false;
  private restartIdx = 0;
  private restartTimer: NodeJS.Timeout | null = null;
  private startedAt = 0;
  private readonly binPath: string;

  constructor() {
    super();
    this.binPath = resolveBinaryPath();
  }

  sendFrame(kind: number, body: Buffer): boolean {
    const child = this.child;
    if (!child || child.killed || !child.stdin.writable) return false;
    return child.stdin.write(FrameCodec.encode(kind, body));
  }

  start(): void {
    if (this.child || this.shuttingDown) return;

    console.info(`[sidecar] spawning ${this.binPath}`);
    const child = spawn(this.binPath, [], { stdio: ['pipe', 'pipe', 'pipe'] });
    this.child = child;
    this.startedAt = Date.now();

    child.stderr.pipe(process.stderr);

    const codec = new FrameCodec();
    child.stdout.on('data', (chunk: Buffer) => codec.push(chunk));
    codec.on('frame', (frame: DecodedFrame) => this.emit('frame', frame));
    codec.on('error', (err: Error) => {
      console.error('[sidecar] frame codec error, killing child:', err.message);
      try { child.kill('SIGKILL'); } catch { /* ignore */ }
    });

    child.on('exit', (code, signal) => {
      const wasUp = Date.now() - this.startedAt;
      console.info(`[sidecar] exited code=${code} signal=${signal} after ${wasUp}ms`);
      this.child = null;
      this.emit('exit', { code, signal });

      if (this.shuttingDown) return;

      if (wasUp >= HEALTHY_RESET_MS) this.restartIdx = 0;
      const delay = BACKOFF_STEPS_MS[Math.min(this.restartIdx, BACKOFF_STEPS_MS.length - 1)];
      this.restartIdx += 1;
      console.info(`[sidecar] restarting in ${delay}ms (attempt ${this.restartIdx})`);
      this.restartTimer = setTimeout(() => {
        this.restartTimer = null;
        this.start();
      }, delay);
    });

    child.on('error', (err) => {
      console.error('[sidecar] spawn error:', err);
    });
  }

  async shutdown(): Promise<void> {
    this.shuttingDown = true;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    const child = this.child;
    if (!child) return;

    console.info('[sidecar] sending SIGTERM');
    child.kill('SIGTERM');

    await new Promise<void>((resolve) => {
      const onExit = () => {
        clearTimeout(killTimer);
        resolve();
      };
      child.once('exit', onExit);
      const killTimer = setTimeout(() => {
        if (this.child === child) {
          console.warn('[sidecar] SIGTERM timed out, sending SIGKILL');
          try { child.kill('SIGKILL'); } catch { /* ignore */ }
        }
      }, SHUTDOWN_TIMEOUT_MS);
    });

    this.child = null;
  }
}
