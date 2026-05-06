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
      try {
        broadcast('vf:event', JSON.parse(frame.body.toString('utf8')));
      } catch (err) {
        console.warn('[sidecar] dropping non-json EVENT frame:', err);
      }
      return;
    }
    case FrameKind.RESULT: {
      // Correlation lands in a later issue — for now just log.
      console.info(`[sidecar] RESULT frame body=${frame.body.length}B`);
      return;
    }
    default:
      console.info(`[sidecar] frame kind=${frame.kind} body=${frame.body.length}B`);
  }
});

ipcMain.handle('vf:call', (_event, method: string, params: unknown) => {
  const body = Buffer.from(JSON.stringify({ method, params: params ?? null }));
  const ok = sidecar.sendFrame(FrameKind.CALL, body);
  if (!ok) throw new Error('sidecar not available');
  // Correlation lands in #10; for now CALL is fire-and-forget.
  return undefined;
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
