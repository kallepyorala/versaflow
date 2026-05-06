import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

type Listener<T> = (payload: T) => void;

function makeChannel<T>(channel: string) {
  const subs = new Set<Listener<T>>();
  ipcRenderer.on(channel, (_event: IpcRendererEvent, payload: T) => {
    for (const cb of subs) {
      try { cb(payload); } catch (err) { console.error(`[preload] ${channel} listener threw`, err); }
    }
  });
  return (cb: Listener<T>) => {
    subs.add(cb);
    return () => { subs.delete(cb); };
  };
}

const subscribeBoot = makeChannel<Uint8Array>('vf:boot');
const subscribeDelta = makeChannel<Uint8Array>('vf:delta');
const subscribeEvent = makeChannel<unknown>('vf:event');

const api = {
  call: (method: string, params?: unknown): Promise<unknown> =>
    ipcRenderer.invoke('vf:call', method, params),

  subscribe: (cb: (delta: unknown) => void): (() => void) => {
    const offBoot = subscribeBoot(cb);
    const offDelta = subscribeDelta(cb);
    return () => { offBoot(); offDelta(); };
  },

  onEvent: (cb: (event: unknown) => void): (() => void) => subscribeEvent(cb),
};

contextBridge.exposeInMainWorld('versaflow', api);

export type VersaflowApi = typeof api;
