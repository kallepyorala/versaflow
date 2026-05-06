export interface VersaflowApi {
  call(method: string, params?: unknown): Promise<unknown>;
  subscribe(cb: (delta: unknown) => void): () => void;
  onBoot(cb: (payload: Uint8Array) => void): () => void;
  onDelta(cb: (payload: Uint8Array) => void): () => void;
  onEvent(cb: (event: unknown) => void): () => void;
}

declare global {
  interface Window {
    versaflow: VersaflowApi;
  }
}

export {};
