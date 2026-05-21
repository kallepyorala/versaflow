# Versaflow Cockpit — Implementation Plan

**Status:** active · **Last updated:** 2026-05-06
**Source:** [DATA-MODEL.md](./DATA-MODEL.md) §12 rollout

This is a living checklist of the GitHub issues that have been filed to make
the static prototype functional. Issues are processed in creation order by a
coding agent; each one is self-contained and small.

Phase A–D landed (#1–#19). Current batch: **Phase E–G below** — provider
abstraction, Linear provider, local git. Ends at the point where the cockpit
is fed by real Linear data and real local git diffs, with seed rows still
present as a no-token fallback. PR / chat / preview tabs remain on fixtures
until later batches.

---

## Phase A — Renderer type prep (no backend yet) ✅

Mechanical type renames called out in DATA-MODEL.md §12.1. Worth doing first
so subsequent steps don't keep paying for the conversion.

- [x] **#1** Split `Issue.id: string` into `id: number` + `externalId: string` + `externalKey: string`
- [x] **#2** Split `Pr` identifiers into `id: number` + `externalId: string` + `number: number`
- [x] **#3** Split `Comment` identifiers + add `clientOpId`, nullable `externalId`, pending render
- [x] **#4** Add `Workspace` and `Worktree` types matching the normalized schema
- [x] **#5** Add `Tab.kind='preview'` discriminant with placeholder view

## Phase B — Sidecar scaffold (Rust + Electron wiring) ✅

Bring up the sidecar binary, the stdio pipe, and the IPC surface. No DB or
schema yet — just a working pipe.

- [x] **#6** Scaffold `sidecar/` Cargo crate (rusqlite, tokio, rmp-serde, tracing); prints "ready"
- [x] **#7** Spawn sidecar from Electron main; lifecycle + crash-restart with backoff
- [x] **#8** Length-prefixed frame envelope codec (5-byte header) on both sides
- [x] **#9** Preload: `contextBridge` exposes `versaflow.call / subscribe / onEvent`
- [x] **#10** JSON CALL/RESULT correlation + error path (control plane only)

## Phase C — SQLite + migrations ✅

System of record. Schema lands in three grouped migrations to keep diffs
reviewable.

- [x] **#11** Open `userData/cockpit.db`; apply `INIT_PRAGMAS` (§3.4)
- [x] **#12** Migration runner: `_migration` table + in-transaction apply loop
- [x] **#13** Migration 0001 — `provider`, `workspace`, `workspace_provider`, `status_map`, `issue` + FTS5
- [x] **#14** Migration 0002 — `worktree`, `pr`, `issue_pr`, `comment`, `pr_check`, `diff_file`
- [x] **#15** Migration 0003 — `agent_session`, `agent_event`, `agent_session_snapshot`, `outbox`, `sync_state`, `ui_state`, `ticker_event`, `preview_target`

## Phase D — Bootstrap round-trip ✅

First end-to-end path: SQLite → working set → BOOT msgpack → renderer store.
By the end of this phase, the renderer reads from a real store backed by
real SQLite, with seed data keeping the cockpit visually identical.

- [x] **#16** Renderer `@/store/store.ts` skeleton — `Map<id, Row>`, indices, `applyDelta`, `subscribe`
- [x] **#17** Sidecar emits BOOT frame (msgpack-encoded snapshot from SQLite); renderer decodes
- [x] **#18** Renderer hydrates store from BOOT; sidebar reads via `useSyncExternalStore` selector
- [x] **#19** Seed migration: insert fixture-equivalent rows so the app remains functional after fixture imports are removed

---

## Phase E — Provider abstraction & sync engine

The Rust-side scaffolding the concrete providers in F and G plug into. By the
end of this phase, the working set is the source of truth for BOOT, indexed
views drive the sidebar, and DELTA frames flow end-to-end with no provider
registered (no-op cycles).

- [ ] **#20** Provider trait + normalized types (`IssueTracker`, `NormalizedIssue/Comment`, `UpdateEvent`, `ProviderError`)
- [ ] **#21** Sidecar working set: `DashMap` rows + `WorkingSet::hydrate` from SQLite; BOOT reads from working set
- [ ] **#22** `ArcSwap` indexed views (`by_status`, `by_assignee`, `pr_by_branch`, `wt_by_path`)
- [ ] **#23** Delta bus + dirty-set coalescing (50 ms / 256-row threshold) + DELTA frame emission
- [ ] **#24** Renderer DELTA wiring + sidebar selectors live-update through `applyDelta`
- [ ] **#25** Sync scheduler (active 30 s / background 5 m / suspend on blur) + window-focus CALL

## Phase F — Linear provider

First real tracker. Status mapping bootstrapped from the team's workflow
states; comments rendered to sanitized HTML on ingest. Per §13: per-workspace
keychain entry; raw payloads stored plaintext.

- [ ] **#26** OS keychain token storage (`keyring`, per-workspace entry per §13 Q7)
- [ ] **#27** Linear GraphQL client (`reqwest` + bearer + `governor`) + `viewer` smoke query
- [ ] **#28** Linear `list_issues` full sync + pagination + status_map seeding from team workflow states
- [ ] **#29** Linear `list_comments` full sync + `pulldown-cmark` + `ammonia` ingest pipeline (writes `body_html` per §3.3)
- [ ] **#30** Linear delta polling — issues + comments since `last_delta_sync_at`
- [ ] **#31** Linear GraphQL subscriptions (`tokio-tungstenite`) feeding the same coalescer as polling
- [ ] **#32** Linear health ping (30 s, surfaces tracker health via `vf:event`)

## Phase G — Local git provider

Worktrees, branches, diffs from `git2` over the local repo. Per §13 Q3:
`git2` for MVP. Diff cache eviction is intentionally deferred to the
observability batch.

- [ ] **#33** `git2` + repo open + worktree enumeration + base/head SHA + ahead/behind upsert
- [ ] **#34** `notify` watcher on `.git/{HEAD,refs/heads,worktrees,index}` with debounced focused refresh
- [ ] **#35** Lazy `diff_file` compute on `(base_sha, head_sha, path)` with `zstd` hunks
- [ ] **#36** Renderer Diff/Compare tabs wired to `diff.list` CALL; `data/files.ts` retired

---

## Out of scope (later batches)

Everything below is intentionally **not** filed yet — these depend on the
current batch landing and on remaining open questions in DATA-MODEL.md §13.

- GitHub provider (PRs, checks, review comments, issue↔PR linking)
- Outbox writer (`comment.create` first, then status changes)
- ACP integration — port `chat-sidecar` from the POC; replace chat fixtures
- Real preview tab — `WebContentsView` + CDP + MCP back-channel
- Manual provider + standalone worktrees
- `/diag` endpoint, observability, agent-event retention, diff cache eviction
