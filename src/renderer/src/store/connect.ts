import { decode } from '@msgpack/msgpack';
import type { BootSnapshot, Delta } from './protocol';

// Wires the renderer to the sidecar via the preload's BOOT/DELTA channels.
// Hydrating the store from BOOT and applying DELTA lands in #18 — for now
// this only exercises the decode path and logs both.
export function connectStore(): () => void {
  if (typeof window === 'undefined' || !window.versaflow) {
    return () => {};
  }

  const offBoot = window.versaflow.onBoot((payload) => {
    try {
      const snapshot = decode(payload) as BootSnapshot;
      console.info('[store] BOOT', snapshot);
    } catch (err) {
      console.error('[store] BOOT msgpack decode failed', err);
    }
  });

  const offDelta = window.versaflow.onDelta((payload) => {
    try {
      const delta = decode(payload) as Delta;
      console.info('[store] DELTA', delta);
    } catch (err) {
      console.error('[store] DELTA msgpack decode failed', err);
    }
  });

  // Signal preload-mounted-and-listening so the sidecar can emit BOOT.
  void window.versaflow.call('vf:ready').catch((err: Error) => {
    console.warn('[store] vf:ready failed', err.cause ?? err);
  });

  return () => {
    offBoot();
    offDelta();
  };
}
