# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Versaflow Cockpit — an Electron + React + TypeScript desktop UI. The app is currently a **static prototype**: the renderer ships the full cockpit experience, but the preload surface is empty and the main process owns nothing beyond window lifecycle. Real backends (IPC, agent processes, git/worktree, Linear, GitHub) are not wired yet — every feed, telemetry value, file list, comment, PR, etc. is fixture data under `src/renderer/src/data/`.

When asked to "wire something up", expect to add an `ipcRenderer`-backed API to `src/preload/index.ts` and a handler in `src/main/index.ts`, then replace the corresponding fixture import in the renderer.

## Commands

This repo uses **pnpm** (see `pnpm-lock.yaml` and `pnpm.onlyBuiltDependencies`).

- `pnpm dev` — `electron-vite dev`. Launches the Electron app with HMR.
- `pnpm build` — `electron-vite build`. Emits `out/main`, `out/preload`, `out/renderer`.
- `pnpm start` — `electron-vite preview`. Runs the built bundle.
- `pnpm typecheck` — runs `tsc --noEmit` against **both** project references: `tsconfig.node.json` (main + preload + the vite config) and `tsconfig.web.json` (renderer). There is no test runner and no linter configured. Always run typecheck before declaring work done.

## Architecture

### Three build targets, one repo

`electron.vite.config.ts` defines three independent builds with different module/runtime assumptions:

- `main` (`src/main/`) — Electron main process. Node runtime. Owns the `BrowserWindow` (hiddenInset titlebar, `contextIsolation: true`, `sandbox: false`, external links forced to system browser).
- `preload` (`src/preload/`) — Electron preload. Currently exports `{}`. This is the **only legitimate place** to expose IPC APIs to the renderer; do not loosen `contextIsolation` or `nodeIntegration`.
- `renderer` (`src/renderer/`) — React 18 SPA. Vite root is `src/renderer`, the entry HTML is `src/renderer/index.html`, and the React tree lives under `src/renderer/src/`. Renderer code uses the alias `@/*` → `src/renderer/src/*` (configured in **both** `electron.vite.config.ts` and `tsconfig.web.json` — keep them in sync).

The CSP in `src/renderer/index.html` is intentionally tight (`script-src 'self'`, `connect-src 'self'`). Adding a CDN script or a remote API will break the renderer until the meta tag is updated.

### Renderer state shape

`src/renderer/src/App.tsx` is the orchestrator. It owns essentially all top-level state — there is no Redux/Zustand/Context-tree. The relevant pieces:

- **Tabs**: a `Tab` discriminated union (`src/renderer/src/types/index.ts`) with `kind` ∈ `overview | issue | diff | pr | compare | chat | term | md`. Seed sets `FULL_TABS` / `NO_WT_TABS` live in `components/tabs/tabs.ts`. Rendering is a switch on `active.kind` at the bottom of `App.tsx` — when adding a new tab kind, update the union, the seed list, `AddKind`, and the dispatch switch.
- **Tweaks** (`useTweaks` in `components/tweaks/TweaksPanel.tsx`): a floating dev panel (toggle with `` ` ``+Shift / `~`). Values feed into the root `<div className="frame" data-density data-scanline data-side-collapsed data-side-narrow data-zen>` — most visual variants are CSS-only, driven off these data-attributes against the tokens in `styles/tokens.css` and `styles/cockpit.css`. Toggling `tweaks.hasWorktree` swaps the tab set and active tab via the `prevHasWtRef` effect.
- **Zen mode**: provided through `ZenContext` (`src/renderer/src/context/zen.ts`). Escape exits.
- **Sidebar width**: persisted to `localStorage` under `vf.sideW`. Below `COLLAPSE_THRESHOLD` (168px) it snaps to a fixed collapsed width.
- **Telemetry / ticker**: simulated by `setInterval` while `tweaks.racing` is on. Source data in `data/ticker.tsx`.

### Styling

Three-file cascade, imported in order from `styles/global.css`:

1. `tokens.css` — design tokens as CSS custom properties (`--vf-teal-*`, `--vf-flux-*`, `--vf-ink-*`, plus shadcn-shaped semantic mappings like `--background`, `--foreground`, `--radius`). Uses `oklch()` throughout.
2. `cockpit.css` — the cockpit chrome and most component styles.
3. `global.css` — resets and a couple of one-offs (e.g. `.titlebar` left-padding to clear the macOS traffic lights when `titleBarStyle: 'hiddenInset'`).

Dark theme is the default and is set on `<body class="dark">` in `index.html`.

### TypeScript

- Strict mode is on for both projects. `noUnusedLocals` / `noUnusedParameters` are off in `tsconfig.web.json`.
- The `@/*` alias only works inside the renderer build. Main and preload code must use relative imports.
