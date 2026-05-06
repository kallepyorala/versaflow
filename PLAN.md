# Versaflow Cockpit — Implementation Plan

**Status:** active · **Last updated:** 2026-05-06
**Source:** [DATA-MODEL.md](./DATA-MODEL.md) §12 rollout

This is a living checklist of the GitHub issues that have been filed to make
the static prototype functional. Issues are processed in creation order by a
coding agent; each one is self-contained and small.

Scope of this batch: **Phase A–D below** — type prep, sidecar scaffold,
schema/migrations, and the first BOOT round-trip with the renderer store.
Stops at the point where the renderer is fed by the sidecar instead of by
fixtures, but with seed data so the cockpit looks identical to the user.

Later batches (Linear provider, GitHub provider, local git, outbox writes,
ACP integration, real preview tab, etc.) will be filed once Phase D is in.

---

## Phase A — Renderer type prep (no backend yet)

Mechanical type renames called out in DATA-MODEL.md §12.1. Worth doing first
so subsequent steps don't keep paying for the conversion.

- [ ] **#1** Split `Issue.id: string` into `id: number` + `externalId: string` + `externalKey: string`
- [ ] **#2** Split `Pr` identifiers into `id: number` + `externalId: string` + `number: number`
- [ ] **#3** Split `Comment` identifiers + add `clientOpId`, nullable `externalId`, pending render
- [ ] **#4** Add `Workspace` and `Worktree` types matching the normalized schema
- [ ] **#5** Add `Tab.kind='preview'` discriminant with placeholder view

## Phase B — Sidecar scaffold (Rust + Electron wiring)

Bring up the sidecar binary, the stdio pipe, and the IPC surface. No DB or
schema yet — just a working pipe.

- [ ] **#6** Scaffold `sidecar/` Cargo crate (rusqlite, tokio, rmp-serde, tracing); prints "ready"
- [ ] **#7** Spawn sidecar from Electron main; lifecycle + crash-restart with backoff
- [ ] **#8** Length-prefixed frame envelope codec (5-byte header) on both sides
- [ ] **#9** Preload: `contextBridge` exposes `versaflow.call / subscribe / onEvent`
- [ ] **#10** JSON CALL/RESULT correlation + error path (control plane only)

## Phase C — SQLite + migrations

System of record. Schema lands in three grouped migrations to keep diffs
reviewable.

- [ ] **#11** Open `userData/cockpit.db`; apply `INIT_PRAGMAS` (§3.4)
- [ ] **#12** Migration runner: `_migration` table + in-transaction apply loop
- [ ] **#13** Migration 0001 — `provider`, `workspace`, `workspace_provider`, `status_map`, `issue` + FTS5
- [ ] **#14** Migration 0002 — `worktree`, `pr`, `issue_pr`, `comment`, `pr_check`, `diff_file`
- [ ] **#15** Migration 0003 — `agent_session`, `agent_event`, `agent_session_snapshot`, `outbox`, `sync_state`, `ui_state`, `ticker_event`, `preview_target`

## Phase D — Bootstrap round-trip

First end-to-end path: SQLite → working set → BOOT msgpack → renderer store.
By the end of this phase, the renderer reads from a real store backed by
real SQLite, with seed data keeping the cockpit visually identical.

- [ ] **#16** Renderer `@/store/store.ts` skeleton — `Map<id, Row>`, indices, `applyDelta`, `subscribe`
- [ ] **#17** Sidecar emits BOOT frame (msgpack-encoded snapshot from SQLite); renderer decodes
- [ ] **#18** Renderer hydrates store from BOOT; sidebar reads via `useSyncExternalStore` selector
- [ ] **#19** Seed migration: insert fixture-equivalent rows so the app remains functional after fixture imports are removed

---

## Out of scope (next batches)

Everything below is intentionally **not** filed yet — these depend on Phase D
being in and on open questions in DATA-MODEL.md §13 being resolved.

- Provider trait + Linear client (full sync, delta polling, GraphQL subs)
- Local git provider (worktree enumeration, fs watch, diff cache with zstd)
- GitHub provider (PRs, checks, review comments, issue↔PR linking)
- Outbox writer (`comment.create` first, then status changes)
- ACP integration — port `chat-sidecar` from the POC; replace chat fixtures
- Real preview tab — `WebContentsView` + CDP + MCP back-channel
- Manual provider + standalone worktrees
- `/diag` endpoint, observability, agent-event retention
