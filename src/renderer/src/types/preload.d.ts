export interface VersaflowApi {
  call(method: string, params?: unknown): Promise<unknown>;
  subscribe(cb: (delta: unknown) => void): () => void;
  onEvent(cb: (event: unknown) => void): () => void;
}

declare global {
  interface Window {
    versaflow: VersaflowApi;
  }
}

export {};
