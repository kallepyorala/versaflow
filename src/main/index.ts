import { app, BrowserWindow, ipcMain, shell, webContents } from 'electron';
import { join } from 'path';
import { SidecarManager } from './sidecar';
import { FrameKind, type DecodedFrame } from './frameCodec';

const isDev = !app.isPackaged;
const sidecar = new SidecarManager();

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 640,
    title: 'Versaflow',
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1c20',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function broadcast(channel: string, payload: unknown): void {
  for (const wc of webContents.getAllWebContents()) {
    if (!wc.isDestroyed()) wc.send(channel, payload);
  }
}

interface CallError { code: string; message: string }
type CallResultEnvelope =
  | { ok: true; value: unknown }
  | { ok: false; error: CallError };

const CALL_TIMEOUT_MS = 30_000;
let nextCallId = 1;
const inflight = new Map<number, {
  resolve: (value: unknown) => void;
  reject: (error: CallError) => void;
  timer: NodeJS.Timeout;
}>();

function rejectAllInflight(error: CallError): void {
  for (const [id, entry] of inflight) {
    clearTimeout(entry.timer);
    entry.reject(error);
    inflight.delete(id);
  }
}

function callSidecar(method: string, params: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const id = nextCallId++;
    const timer = setTimeout(() => {
      inflight.delete(id);
      reject({ code: 'timeout', message: `call ${method} timed out after ${CALL_TIMEOUT_MS}ms` });
    }, CALL_TIMEOUT_MS);
    inflight.set(id, { resolve, reject, timer });

    const body = Buffer.from(JSON.stringify({ id, method, params: params ?? null }));
    const sent = sidecar.sendFrame(FrameKind.CALL, body);
    if (!sent) {
      clearTimeout(timer);
      inflight.delete(id);
      reject({ code: 'sidecar_unavailable', message: 'sidecar not available' });
    }
  });
}

sidecar.on('frame', (frame: DecodedFrame) => {
  switch (frame.kind) {
    case FrameKind.BOOT: {
      // msgpack body; pass through as Uint8Array for the renderer to decode.
      broadcast('vf:boot', new Uint8Array(frame.body));
      return;
    }
    case FrameKind.DELTA: {
      broadcast('vf:delta', new Uint8Array(frame.body));
      return;
    }
    case FrameKind.EVENT: {
      let parsed: unknown;
      try {
        parsed = JSON.parse(frame.body.toString('utf8'));
      } catch (err) {
        console.warn('[sidecar] dropping non-json EVENT frame:', err);
        return;
      }
      broadcast('vf:event', parsed);
      if (typeof parsed === 'object' && parsed !== null && (parsed as { type?: string }).type === 'sidecar.ready') {
        void initSidecarDb();
      }
      return;
    }
    case FrameKind.RESULT: {
      let parsed: { id?: unknown; ok?: unknown; result?: unknown; error?: unknown };
      try {
        parsed = JSON.parse(frame.body.toString('utf8'));
      } catch (err) {
        console.warn('[sidecar] dropping non-json RESULT frame:', err);
        return;
      }
      const id = typeof parsed.id === 'number' ? parsed.id : -1;
      const entry = inflight.get(id);
      if (!entry) {
        console.warn(`[sidecar] RESULT for unknown id=${id}`);
        return;
      }
      inflight.delete(id);
      clearTimeout(entry.timer);
      if (parsed.ok === true) {
        entry.resolve(parsed.result ?? null);
      } else {
        const err = (parsed.error ?? {}) as Partial<CallError>;
        entry.reject({
          code: typeof err.code === 'string' ? err.code : 'unknown',
          message: typeof err.message === 'string' ? err.message : 'call rejected',
        });
      }
      return;
    }
    default:
      console.info(`[sidecar] frame kind=${frame.kind} body=${frame.body.length}B`);
  }
});

sidecar.on('exit', () => {
  rejectAllInflight({ code: 'sidecar_unavailable', message: 'sidecar exited' });
});

async function initSidecarDb(): Promise<void> {
  const dbPath = join(app.getPath('userData'), 'cockpit.db');
  try {
    const result = await callSidecar('vf:init', { dbPath });
    console.info('[sidecar] db init', { dbPath, result });
  } catch (err) {
    console.error('[sidecar] db init failed:', err);
  }
}

ipcMain.handle('vf:call', async (_event, method: string, params: unknown): Promise<CallResultEnvelope> => {
  try {
    const value = await callSidecar(method, params);
    return { ok: true, value };
  } catch (err) {
    const e = err as Partial<CallError>;
    return {
      ok: false,
      error: {
        code: typeof e.code === 'string' ? e.code : 'unknown',
        message: typeof e.message === 'string' ? e.message : 'call failed',
      },
    };
  }
});

app.whenReady().then(() => {
  sidecar.start();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

let isQuitting = false;
app.on('before-quit', (event) => {
  if (isQuitting) return;
  isQuitting = true;
  event.preventDefault();
  void sidecar.shutdown().finally(() => app.exit(0));
});
