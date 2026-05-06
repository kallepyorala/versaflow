# Versaflow Cockpit — Data Model & Caching Strategy

**Status:** proposal · **Owner:** sidecar/data
**Scope:** the persistence + caching layer that sits behind the cockpit UI, served by a Rust sidecar over IPC.

---

## 1. Goals & non-goals

### Goals
1. **Frame-budget reads.** Anything the active view needs reads from local memory in microseconds, never from disk or network during a render.
2. **Pluggable issue trackers.** Linear and GitHub at MVP, with a normalized core that other providers (Jira, Plane, manual) can slot into without touching the renderer.
3. **Worktree-first model.** A worktree is a first-class entity, not derived from an issue. Worktrees without an issue are normal, not an edge case.
4. **Offline-first writes.** User actions (post comment, change status, add worktree) commit locally first, replicate to the tracker via an outbox.
5. **Cold-start under one frame.** The cockpit is interactive within ~16ms of the renderer mounting, fed by a single bootstrap payload from the sidecar.
6. **Survive crashes and restarts.** All state in SQLite WAL — even mid-stream agent sessions can be replayed.
7. **Runtime preview is first-class.** The cockpit owns a live `WebContentsView` pointed at the dev server, observable by both the user and the agents (console / network / DOM / screenshots / CDP), per the POC. It's a tab kind in the renderer, a service in the sidecar.

### Non-goals (for MVP)
- Encryption at rest beyond OS file permissions. Auth tokens in keychain; everything else in plaintext SQLite.
- Multi-user / shared DB. Each instance owns its file. Team sync, if it ever happens, is a separate service.
- Generic ORM. ~30 tables, hand-written SQL with prepared statements is faster to write, faster to read, and faster to run than `diesel`/`sea-orm`.
- Real-time mirror of every Linear/GitHub field. We store what the cockpit displays plus a `payload_json` blob for what we don't (yet) normalize.

---

## 2. Architecture — the three caches

```
┌──────────────────────────────────────────────────────────────────────────┐
│  RENDERER (React, dumb)                                                  │
│  normalized in-memory store, useSyncExternalStore selectors              │
│    issues  comments  prs  checks  tickers  agentSessions  tabs  prefs    │
│      ▲           bootstrap (msgpack, once)        delta (msgpack, hot)   │
│      │                  │                                │               │
│ ─────┼──────────────────┼────────────────────────────────┼─── IPC ──────│
│      │                  ▼                                ▼               │
│  ELECTRON MAIN (preload bridge)  ─ proxies frames, owns no state ─       │
│      ▲                                                                   │
│ ─────┼──────────── stdin/stdout (length-prefixed) ───────────────────────│
│      │                                                                   │
│  SIDECAR (Rust, tokio)                                                   │
│   working set  Arc<DashMap<id, T>>  +  ArcSwap<IndexedViews>             │
│   subscribe()  ─ predicate-matched delta bus ─                           │
│      ▲                          ▲                                        │
│      │ git2 / fs watch          │ HTTP(S), GraphQL, WebSocket            │
│      │                          │                                        │
│   git refs / worktrees       Linear (GraphQL + subs)  GitHub (REST+GQL)  │
│                                                                          │
│   ─── PRAGMA journal_mode=WAL · mmap_size=2GB · cache_size=256MB ───     │
│   SQLite (cockpit.db)                                                    │
│     issue · pr · comment · check · diff_file · agent_event · outbox …    │
└──────────────────────────────────────────────────────────────────────────┘
```

| Layer | Role | Latency budget | Backed by |
|---|---|---|---|
| **L1 — Renderer store** | Selector for the active view. Pure JS objects. No I/O. | < 100 µs per read | `Map<id, Row>` + status indices; `useSyncExternalStore` |
| **L2 — Sidecar working set** | Source of truth for the renderer. Receives writes from sync + outbox; emits deltas. | ~1–10 µs per row read | `dashmap::DashMap` rows + `arc-swap::ArcSwap` indexed views |
| **L3 — SQLite** | System of record + recovery + search. The sidecar reads from L3 once at boot, then incrementally on sync. | 5–50 µs WAL+mmap reads | rusqlite, FTS5, JSON1 |
| **L4 — Network** | Linear / GitHub. Authoritative, but slow and unreliable. | 50–500 ms | reqwest, tokio-tungstenite |

The discipline that makes this fast is rigid: **the renderer never reads from L3 or L4.** It only reads from its own L1, which is hydrated by the sidecar pushing typed deltas. SQLite is a private detail of the sidecar.

---

## 3. Schema (SQLite)

### 3.1 Conventions
- Every table has `id INTEGER PRIMARY KEY` (rowid alias) for cache locality.
- Tables that mirror a remote tracker entity (`issue`, `pr`, `comment`, `pr_check`) carry an `external_id TEXT` plus a uniqueness index per parent scope. Purely-local tables (`worktree`, `diff_file`, `agent_*`, `outbox`, `sync_state`, `ui_state`, `ticker_event`, `preview_target`) don't.
- Timestamps are `INTEGER` Unix milliseconds (UTC). No `TEXT` dates.
- Soft-typed columns (provider-specific fields) live in `payload_json TEXT` and are queried via JSON1's `json_extract`.
- Enum-shaped columns carry inline `CHECK (col IN (...))` constraints; the canonical value lists live with each table.
- All FK constraints are declared but enforced via `PRAGMA foreign_keys = ON` at connect time.

### 3.2 Tables

```sql
-- ── Providers & workspaces ─────────────────────────────────────────────

CREATE TABLE provider (
  id            INTEGER PRIMARY KEY,
  kind          TEXT NOT NULL CHECK (kind IN ('linear','github','manual')),
  name          TEXT NOT NULL,           -- user-facing label
  account_id    TEXT NOT NULL,           -- linear org id, gh owner, etc.
  config_json   TEXT NOT NULL,           -- api url, default repo, status map…
  added_at      INTEGER NOT NULL,
  UNIQUE(kind, account_id)
);

CREATE TABLE workspace (
  id                    INTEGER PRIMARY KEY,
  name                  TEXT NOT NULL,
  root_path             TEXT NOT NULL UNIQUE,    -- abs path to the repo
  default_provider_id   INTEGER REFERENCES provider(id),
  default_branch        TEXT NOT NULL DEFAULT 'main',
  active_context_json   TEXT                     -- {issue_id?, worktree_id?, pr_id?}
);

-- A workspace can talk to multiple providers (e.g. Linear for tickets, GH for PRs).
CREATE TABLE workspace_provider (
  workspace_id  INTEGER NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  provider_id   INTEGER NOT NULL REFERENCES provider(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('issues','prs','both')),
  PRIMARY KEY(workspace_id, provider_id)
);

-- ── Status normalization ───────────────────────────────────────────────
-- We store an opinionated, fixed set of "normalized" statuses (matching the
-- renderer's IssueStatus union). Per provider, a configurable mapping table
-- translates raw tracker statuses into our canonical names.

-- Scoped by workspace because two workspaces sharing one provider account
-- (e.g. two GitHub repos under the same org token, or two Linear teams under
-- one workspace token) often want different mappings.
CREATE TABLE status_map (
  workspace_id   INTEGER NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  provider_id    INTEGER NOT NULL REFERENCES provider(id) ON DELETE CASCADE,
  raw_status     TEXT NOT NULL,         -- "In Progress", "open", "Triage"…
  normalized     TEXT NOT NULL CHECK (normalized IN
                   ('backlog','todo','in_progress','in_review','in_verification','done','cancelled')),
  PRIMARY KEY(workspace_id, provider_id, raw_status)
);

-- ── Issues ─────────────────────────────────────────────────────────────

CREATE TABLE issue (
  id                    INTEGER PRIMARY KEY,
  workspace_id          INTEGER NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  provider_id           INTEGER NOT NULL REFERENCES provider(id),
  external_id           TEXT NOT NULL,             -- linear node id / gh node id
  external_key          TEXT,                      -- "VF-1284" / "owner/repo#123"
  title                 TEXT NOT NULL,
  body_md               TEXT,
  status                TEXT NOT NULL CHECK (status IN
                          ('backlog','todo','in_progress','in_review','in_verification','done','cancelled')),
  status_raw            TEXT,                      -- tracker's own name
  priority              INTEGER,                   -- 0..4
  assignee_external_id  TEXT,
  assignee_name         TEXT,
  url                   TEXT,
  hot                   REAL,                      -- computed hotness 0..1
  spark_json            TEXT,                      -- recent activity series
  payload_json          TEXT,                      -- raw tracker payload
  archived              INTEGER NOT NULL DEFAULT 0,
  updated_at_remote     INTEGER,
  fetched_at            INTEGER NOT NULL,
  UNIQUE(provider_id, external_id)
);

CREATE INDEX idx_issue_workspace_status ON issue(workspace_id, status, archived);
CREATE INDEX idx_issue_workspace_assignee ON issue(workspace_id, assignee_external_id);
CREATE INDEX idx_issue_external_key ON issue(external_key);

-- FTS column names must match the external content table's columns; the
-- column is named `body_md` to align with `issue.body_md`. Otherwise FTS5
-- rebuild / 'delete-all' commands fail with `no such column: T.body`.
CREATE VIRTUAL TABLE issue_fts USING fts5(
  external_key, title, body_md, content='issue', content_rowid='id'
);

CREATE TRIGGER issue_ai AFTER INSERT ON issue BEGIN
  INSERT INTO issue_fts(rowid, external_key, title, body_md)
    VALUES (new.id, coalesce(new.external_key,''), new.title, coalesce(new.body_md,''));
END;
CREATE TRIGGER issue_au AFTER UPDATE ON issue BEGIN
  INSERT INTO issue_fts(issue_fts, rowid, external_key, title, body_md)
    VALUES('delete', old.id, coalesce(old.external_key,''), old.title, coalesce(old.body_md,''));
  INSERT INTO issue_fts(rowid, external_key, title, body_md)
    VALUES (new.id, coalesce(new.external_key,''), new.title, coalesce(new.body_md,''));
END;
CREATE TRIGGER issue_ad AFTER DELETE ON issue BEGIN
  INSERT INTO issue_fts(issue_fts, rowid, external_key, title, body_md)
    VALUES('delete', old.id, coalesce(old.external_key,''), old.title, coalesce(old.body_md,''));
END;

-- ── Worktrees (independent of issues!) ─────────────────────────────────

CREATE TABLE worktree (
  id              INTEGER PRIMARY KEY,
  workspace_id    INTEGER NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  issue_id        INTEGER REFERENCES issue(id) ON DELETE SET NULL,   -- NULLABLE
  path            TEXT NOT NULL UNIQUE,          -- abs path
  branch          TEXT NOT NULL,
  base_branch     TEXT,                          -- usually 'main'
  base_sha        TEXT,
  head_sha        TEXT,
  ahead           INTEGER NOT NULL DEFAULT 0,
  behind          INTEGER NOT NULL DEFAULT 0,
  is_active       INTEGER NOT NULL DEFAULT 0,    -- one active per workspace, enforced below
  origin          TEXT NOT NULL DEFAULT 'manual'
                    CHECK (origin IN ('manual','agent','pr_checkout')),
  label           TEXT,                          -- optional human label, e.g. "rtk-experiment"
  created_at      INTEGER NOT NULL,
  last_seen_at    INTEGER NOT NULL,
  removed_at      INTEGER                        -- soft-delete; row sticks for history
);

CREATE INDEX idx_worktree_issue ON worktree(issue_id) WHERE issue_id IS NOT NULL;
-- Enforces "at most one active worktree per workspace" at the schema level.
CREATE UNIQUE INDEX uniq_worktree_workspace_active ON worktree(workspace_id) WHERE is_active = 1;

-- ── PRs ────────────────────────────────────────────────────────────────

CREATE TABLE pr (
  id                  INTEGER PRIMARY KEY,
  workspace_id        INTEGER NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  provider_id         INTEGER NOT NULL REFERENCES provider(id),
  external_id         TEXT NOT NULL,
  number              INTEGER NOT NULL,
  title               TEXT NOT NULL,
  body_md             TEXT,
  state               TEXT NOT NULL CHECK (state IN ('open','closed','merged','draft')),
  review_state        TEXT CHECK (review_state IN ('pending','approved','changes_requested','review')),
  checks_state        TEXT CHECK (checks_state IN ('pass','pending','fail')),  -- rolled up
  base_branch         TEXT NOT NULL,
  head_branch         TEXT NOT NULL,
  base_sha            TEXT,
  head_sha            TEXT,
  author_external_id  TEXT,
  author_name         TEXT,
  url                 TEXT,
  diff_added          INTEGER,
  diff_removed        INTEGER,
  diff_files          INTEGER,
  payload_json        TEXT,
  updated_at_remote   INTEGER,
  fetched_at          INTEGER NOT NULL,
  UNIQUE(provider_id, external_id)
);

CREATE INDEX idx_pr_workspace_state ON pr(workspace_id, state);
CREATE INDEX idx_pr_head_branch ON pr(workspace_id, head_branch);

-- Issues ↔ PRs is many-to-many: a PR can fix multiple, an issue can have several attempts.
CREATE TABLE issue_pr (
  issue_id  INTEGER NOT NULL REFERENCES issue(id) ON DELETE CASCADE,
  pr_id     INTEGER NOT NULL REFERENCES pr(id) ON DELETE CASCADE,
  link_kind TEXT NOT NULL DEFAULT 'fixes',     -- 'fixes'|'mentions'|'manual'
  PRIMARY KEY(issue_id, pr_id)
);

-- ── Comments ───────────────────────────────────────────────────────────
-- One table for issue comments, PR conversation, and PR review comments.
-- The `parent_kind` discriminator avoids three almost-identical tables.

CREATE TABLE comment (
  id                  INTEGER PRIMARY KEY,
  workspace_id        INTEGER NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  parent_kind         TEXT NOT NULL CHECK (parent_kind IN ('issue','pr','review')),
  parent_id           INTEGER NOT NULL,          -- FK by parent_kind, no constraint
  external_id         TEXT,                      -- NULL while pending outbox ack; set on remote create
  client_op_id        TEXT,                      -- echoes outbox.client_op_id; lets us correlate the optimistic row
  author_external_id  TEXT,
  author_name         TEXT,
  author_role         TEXT,                      -- 'pm'|'eng'|'design'|'agent'|null
  is_agent            INTEGER NOT NULL DEFAULT 0,
  body_md             TEXT NOT NULL,             -- source of truth
  body_html           TEXT,                      -- pre-rendered, sanitized; see §3.3
  status              TEXT CHECK (status IN ('open','addressed','stale')),  -- review only
  file_path           TEXT,                      -- review-comment anchor
  line                INTEGER,
  reactions_json      TEXT,                      -- [{e,n}]
  created_at_remote   INTEGER,
  fetched_at          INTEGER NOT NULL
);

-- Uniqueness only applies to rows that have been confirmed by the remote.
CREATE UNIQUE INDEX uniq_comment_external  ON comment(parent_kind, external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX uniq_comment_client_op ON comment(client_op_id)              WHERE client_op_id IS NOT NULL;
CREATE INDEX idx_comment_parent ON comment(parent_kind, parent_id, created_at_remote);

-- ── PR checks ──────────────────────────────────────────────────────────

CREATE TABLE pr_check (
  id            INTEGER PRIMARY KEY,
  pr_id         INTEGER NOT NULL REFERENCES pr(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  source        TEXT NOT NULL,           -- 'GitHub Actions'|'Versaflow'|'Vercel'…
  state         TEXT NOT NULL CHECK (state IN ('pass','fail','run','skip','queued')),
  required      INTEGER NOT NULL,
  duration_ms   INTEGER,
  error_text    TEXT,
  external_id   TEXT,
  fetched_at    INTEGER NOT NULL,
  UNIQUE(pr_id, name)
);

-- ── File diffs (computed locally with libgit2, cached by sha pair) ─────

CREATE TABLE diff_file (
  id            INTEGER PRIMARY KEY,
  base_sha      TEXT NOT NULL,
  head_sha      TEXT NOT NULL,
  path          TEXT NOT NULL,
  rename_from   TEXT,
  status        TEXT NOT NULL CHECK (status IN ('M','A','D','R','T')),
  added         INTEGER NOT NULL,
  removed       INTEGER NOT NULL,
  hunks_zstd    BLOB,                    -- zstd(unified-diff text)
  is_binary     INTEGER NOT NULL DEFAULT 0,
  computed_at   INTEGER NOT NULL,
  UNIQUE(base_sha, head_sha, path)
);

CREATE INDEX idx_diff_pair ON diff_file(base_sha, head_sha);

-- ── Agent sessions & event stream ──────────────────────────────────────

CREATE TABLE agent_session (
  id            INTEGER PRIMARY KEY,
  workspace_id  INTEGER NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  issue_id      INTEGER REFERENCES issue(id) ON DELETE SET NULL,
  worktree_id   INTEGER REFERENCES worktree(id) ON DELETE SET NULL,
  pr_id         INTEGER REFERENCES pr(id) ON DELETE SET NULL,
  agent_kind    TEXT NOT NULL,           -- 'claude'|'codex'|'gpt-5'|...
  model         TEXT,
  state         TEXT NOT NULL CHECK (state IN ('active','leading','errored','idle')),
  cwd           TEXT NOT NULL,
  started_at    INTEGER NOT NULL,
  ended_at      INTEGER,
  stop_reason   TEXT,
  metadata_json TEXT
);

CREATE INDEX idx_session_workspace_state ON agent_session(workspace_id, state);

-- Append-only firehose. One row per ACP SessionUpdate / chunk / done / error.
-- INTEGER primary key + WITHOUT ROWID would be ideal, but FTS triggers fight
-- WITHOUT ROWID; keep rowid here for simplicity, partition by session_id.
--
-- `seq` is the canonical ordering key. `ts` (wall-clock ms) is too coarse for
-- bursts of streamed chunks within one millisecond, and the global rowid
-- mixes sessions. Each session maintains its own monotonic counter, replayed
-- by `ORDER BY seq`.
CREATE TABLE agent_event (
  id            INTEGER PRIMARY KEY,
  session_id    INTEGER NOT NULL REFERENCES agent_session(id) ON DELETE CASCADE,
  seq           INTEGER NOT NULL,        -- per-session monotonic; the replay/coalescing key
  ts            INTEGER NOT NULL,        -- wall-clock ms; used for display, not ordering
  kind          TEXT NOT NULL CHECK (kind IN
                  ('chunk','thought','tool_call','tool_result','permission','error','done','browser_action')),
  tool_call_id  TEXT,                    -- coalescing key for tool cards
  payload_json  TEXT NOT NULL,
  UNIQUE(session_id, seq)
);

CREATE INDEX idx_event_session_ts       ON agent_event(session_id, ts);
CREATE INDEX idx_event_session_toolcall ON agent_event(session_id, tool_call_id) WHERE tool_call_id IS NOT NULL;

-- Periodic checkpoint to bound recovery time on session resume.
-- A snapshot is the working-set view of a session at a given event id.
CREATE TABLE agent_session_snapshot (
  session_id     INTEGER NOT NULL REFERENCES agent_session(id) ON DELETE CASCADE,
  last_seq       INTEGER NOT NULL,       -- agent_event.seq at snapshot time; resume from seq+1
  state_json     TEXT NOT NULL,          -- chat thread, tool cards, permissions
  taken_at       INTEGER NOT NULL,
  PRIMARY KEY(session_id, last_seq)
);

-- ── Runtime preview targets (the "browser tab") ───────────────────────
-- Configuration for the WebContentsView pane. Buffers (console / network)
-- are *not* persisted — see §6.4. Only the durable config lives here.

CREATE TABLE preview_target (
  id            INTEGER PRIMARY KEY,
  workspace_id  INTEGER NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,                  -- 'web', 'mobile', 'storybook'
  url           TEXT NOT NULL,                  -- 'http://localhost:3333'
  start_cmd     TEXT,                           -- optional: 'pnpm dev', spawned + watched
  start_cwd     TEXT,                           -- usually the active worktree path
  start_env_json TEXT,                          -- extra env vars
  is_default    INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,
  UNIQUE(workspace_id, name)
);

-- Enforces "at most one default preview target per workspace".
CREATE UNIQUE INDEX uniq_preview_default ON preview_target(workspace_id) WHERE is_default = 1;

-- ── Outbox (offline-first writes) ──────────────────────────────────────

CREATE TABLE outbox (
  id            INTEGER PRIMARY KEY,
  workspace_id  INTEGER NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  client_op_id  TEXT NOT NULL UNIQUE,      -- caller-generated UUIDv4; the idempotency key for retries
  op            TEXT NOT NULL,             -- 'comment.create'|'issue.status'|'pr.review'|...
  target_kind   TEXT NOT NULL,             -- 'issue'|'pr'|'comment'
  target_id     INTEGER,                   -- local id of the optimistic row
  payload_json  TEXT NOT NULL,
  state         TEXT NOT NULL CHECK (state IN ('pending','inflight','done','failed','dead')),
  attempts      INTEGER NOT NULL DEFAULT 0,
  next_retry_at INTEGER,
  last_error    TEXT,
  enqueued_at   INTEGER NOT NULL,
  done_at       INTEGER
);

CREATE INDEX idx_outbox_state_retry ON outbox(state, next_retry_at) WHERE state IN ('pending','failed');

-- ── Sync watermarks ────────────────────────────────────────────────────

-- Watermarks are per (workspace, provider) because one provider account
-- (e.g. a single Linear workspace token, or a single GH org token) can
-- serve multiple Versaflow workspaces — each one has its own sync clock.
CREATE TABLE sync_state (
  workspace_id         INTEGER NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  provider_id          INTEGER NOT NULL REFERENCES provider(id) ON DELETE CASCADE,
  resource             TEXT NOT NULL,     -- 'issues'|'prs'|'comments:issue:<id>'|'checks:<pr_id>'
  last_cursor          TEXT,
  last_full_sync_at    INTEGER,
  last_delta_sync_at   INTEGER,
  etag                 TEXT,
  PRIMARY KEY(workspace_id, provider_id, resource)
);

-- ── UI state (tabs, splits, tweaks) ────────────────────────────────────

CREATE TABLE ui_state (
  workspace_id INTEGER NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  key          TEXT NOT NULL,             -- 'tabs'|'tweaks'|'sidebar.width'|'last.tab'…
  value_json   TEXT NOT NULL,
  updated_at   INTEGER NOT NULL,
  PRIMARY KEY(workspace_id, key)
);

-- ── Tickers / activity feed (for sidebar) ──────────────────────────────
-- Generated from agent_event + issue/pr changes. Persisted so it survives
-- restarts; capped by a periodic delete.

CREATE TABLE ticker_event (
  id            INTEGER PRIMARY KEY,
  workspace_id  INTEGER NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  ts            INTEGER NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('now','ok','tealed','fail')),
  issue_key     TEXT,
  agent_kind    TEXT,
  body_md       TEXT NOT NULL,            -- pre-rendered short text
  payload_json  TEXT
);

CREATE INDEX idx_ticker_ws_ts ON ticker_event(workspace_id, ts DESC);
```

### 3.3 Sanitization & trust boundaries

Tracker markdown is **untrusted input**. Linear and GitHub render comments through their own sanitizers; we have to do our own before persisting `body_html`.

- **Where it runs.** The sidecar sanitizes once, on ingest, before writing `comment.body_html`. The renderer treats `body_html` as already-safe and pastes it into a constrained DOM region (`<div class="md">…`). Sanitizing in two places duplicates risk surface and CPU.
- **Sanitizer.** `ammonia` (`html5ever`-backed, the rust analog of DOMPurify), with the conservative default allow-list plus: `code`, `pre`, `kbd`, `details`/`summary`, fenced code-block class names, and `a[href]` restricted to `http(s):` and `mailto:`. No `style`, no `on*` attributes, no `<script>`, no `<iframe>`, no `data:` URLs in `<img src>`.
- **Markdown.** `pulldown-cmark` (CommonMark + tables + strikethrough + tasklists), then through `ammonia`. The pipeline is `body_md → cmark → ammonia → body_html`.
- **Resanitize on schema bump.** The sanitizer's allow-list will tighten over time; keep `body_md` as the source of truth so we can rebuild `body_html` for the entire DB on migration. Renderer never touches `body_md` for display.
- **Agent-authored comments** (`is_agent = 1`) go through the same pipeline. Agents output untrusted markdown by definition.

The same rules apply to any other rendered-once HTML field we add later (issue body preview, PR description). When in doubt, store the source markup and re-render on read.

### 3.4 PRAGMAs at connect time

```rust
const INIT_PRAGMAS: &str = r#"
PRAGMA journal_mode    = WAL;
PRAGMA synchronous     = NORMAL;       -- WAL + NORMAL: durable except <1s lost on crash
PRAGMA temp_store      = MEMORY;
PRAGMA mmap_size       = 2147483648;   -- 2 GiB; SQLite caps at file size anyway
PRAGMA cache_size      = -262144;      -- 256 MiB page cache, negative = KiB
PRAGMA foreign_keys    = ON;
PRAGMA wal_autocheckpoint = 2000;      -- ~8 MiB between checkpoints
PRAGMA busy_timeout    = 5000;
"#;
```

### 3.5 Migrations

Bare-metal: a `_migration(id INTEGER PRIMARY KEY, applied_at INTEGER)` table plus a `Vec<&'static str>` of SQL scripts in the sidecar. On boot, apply unapplied scripts in a transaction, bump `PRAGMA user_version`. No `diesel migration` ceremony.

---

## 4. Tracker abstraction

The renderer never speaks Linear or GitHub. It speaks **Versaflow's normalized model**, period. The sidecar owns the translation.

### 4.1 The provider trait

```rust
#[async_trait]
pub trait IssueTracker: Send + Sync + 'static {
    fn kind(&self) -> ProviderKind;                 // Linear | Github | Manual

    /// Pull issues that changed since `since`. None = full sync.
    /// Pagination is the implementation's problem; it returns a stream
    /// of normalized issues so the caller can batch into SQLite.
    fn list_issues<'a>(
        &'a self,
        workspace: &'a Workspace,
        since: Option<DateTime<Utc>>,
    ) -> BoxStream<'a, Result<NormalizedIssue>>;

    async fn get_issue(&self, ext_id: &str) -> Result<NormalizedIssue>;

    fn list_comments<'a>(
        &'a self,
        issue_ext_id: &'a str,
        since: Option<DateTime<Utc>>,
    ) -> BoxStream<'a, Result<NormalizedComment>>;

    async fn create_comment(&self, issue_ext_id: &str, body_md: &str) -> Result<NormalizedComment>;
    async fn update_status(&self, issue_ext_id: &str, status: NormalizedStatus) -> Result<()>;

    /// Optional live channel. Linear has GraphQL subs; GitHub doesn't.
    /// When None, the sync engine falls back to polling.
    async fn subscribe(&self, workspace: &Workspace) -> Option<BoxStream<'static, Result<UpdateEvent>>>;

    /// Health for the status pill. Cheap call; OK to run on a 30s timer.
    async fn ping(&self) -> Result<TrackerHealth>;
}
```

GitHub gets a parallel **`PrProvider`** trait covering PRs/checks/reviews; Linear doesn't implement it. A workspace's `workspace_provider.role` tells the sync engine which trait to call into.

### 4.2 Status mapping

- The renderer's `IssueStatus` is canonical: `backlog | todo | in_progress | in_review | in_verification | done | cancelled`.
- **Linear** has matching states out of the box; defaults are baked in.
- **GitHub Issues** has only `open|closed`. We extend with conventions:
  - Default mapping: `open → todo`, `closed → done`.
  - Optional: a `status_map` row pattern like `status:in-progress` (label) → `in_progress`, falling back to the default.
  - If the workspace uses GitHub Projects v2: column name → status (configurable per project).
- **Manual** workspaces (no tracker, just worktrees + scratch tickets) use a single `manual` provider with all statuses literal.

### 4.3 Worktree-without-issue

Three flows produce worktrees, all first-class:

1. **From an issue.** `worktree.issue_id` is set. The cockpit's context bar shows the linked issue.
2. **From a PR you didn't author.** `worktree.issue_id = NULL`, but `worktree.branch` matches a `pr.head_branch`. Context bar shows the PR.
3. **Standalone.** `issue_id = NULL` and no matching PR. Context bar shows just the branch + a free-form scratch doc.

In all three, the rest of the cockpit (chat tabs, terminal, diff, race lanes) works identically. The renderer treats the active context as `{ workspaceId, worktreeId?, issueId?, prId? }` — any combination is valid as long as `workspaceId` is set.

The key invariant: **the cockpit's read path keys off the worktree, not the issue.** Issue is enrichment.

---

## 5. Sync engine

Pull and push are independent state machines.

### 5.1 Pull (network → SQLite → working set)

- **Bootstrap (cold start, first time on a new workspace).** Full pagination of `list_issues`, `list_prs`, etc. Bulk-insert into SQLite in 1k-row transactions. Update `sync_state.last_full_sync_at`.
- **Delta sync (steady state).**
  - **Active workspace:** every 30s (configurable). Use `since = last_delta_sync_at - 60s` (one-minute slack for clock skew).
  - **Background workspaces:** every 5 min.
  - **Window blur:** suspend.
- **Live channel.** When the provider implements `subscribe()`, run it in parallel with delta polling. Linear's GraphQL subs cover issue/comment changes; we still poll for any resource the subs miss.
- **Coalescing.** A burst of webhook-like events for the same issue collapses into one upsert by remote `updated_at`.

Inside the sidecar, the pull loop is:

```rust
while let Some(item) = stream.next().await {
    let item = item?;
    let dirty = upsert_issue(&conn, &item)?;        // returns Option<IssueId> if changed
    if let Some(id) = dirty { dirty_set.insert(id); }
    if dirty_set.len() > 256 || last_flush.elapsed() > Duration::from_millis(50) {
        flush_to_working_set(&working_set, &dirty_set);
        delta_bus.publish(Delta::Issues(dirty_set.drain().collect()));
        last_flush = Instant::now();
    }
}
```

50 ms / 256 rows is the natural batching point: human-perceptible enough to feel live, big enough that we're not waking React on every row during a bulk sync.

### 5.2 Push (UI action → outbox → network)

Every mutation gets a caller-generated `client_op_id` (UUIDv4) at the moment of optimistic insert. That id flows into both the optimistic row and the outbox row, gives the worker an idempotency key when the tracker supports one, and lets the renderer correlate "the comment I just typed" with the eventual remote-acked row. The optimistic comment row is inserted with `external_id = NULL`; the partial unique index `uniq_comment_external` (§3.2) only kicks in once the remote confirms.

```
user clicks "comment"
   │
   ▼
sidecar.mutate(CommentCreate { issue_id, body })
   │  - client_op_id = uuid_v4()
   │  - tx BEGIN
   │  - INSERT into comment (external_id=NULL, client_op_id=$op, …)
   │  - INSERT into outbox  (client_op_id=$op, op='comment.create',
   │                         target_kind='comment', target_id=<row>, state='pending')
   │  - tx COMMIT
   │  - publish delta → renderer sees the comment instantly (rendered in
   │                    a "pending" state because external_id is NULL)
   ▼
outbox worker picks pending row (state='pending', next_retry_at <= now)
   │  - state='inflight'; attempts++
   │  - tracker.create_comment(client_op_id, body)   ← idempotency key passed
   │                                                   if the provider supports it
   │     ├─ ok → UPDATE comment SET external_id=<remote_id>, …
   │             UPDATE outbox  SET state='done', done_at=now
   │     └─ err (transient) → UPDATE outbox SET state='failed',
   │                                              last_error, next_retry_at=now+backoff
   │     └─ err (permission/4xx) → state='dead'; surface to renderer
   ▼
delta published on either path
```

**Idempotency note.** Linear's GraphQL `commentCreate` accepts a client-supplied id; we pass `client_op_id` as that key. GitHub's REST API does not, so the worker recovers from a "crashed after the network call returned 201" by querying the just-created issue/PR for a comment matching `(author=me, body=hash, time≈inflight_started)` and adopting its id. If no match is found within a 60s window, we re-send and accept a possible duplicate — the renderer can then collapse the two by `client_op_id` once the second response lands. The provider trait gets a `supports_idempotency_key()` flag so the engine knows which recovery path to take.

Backoff: exponential with jitter (1s → 2s → 4s → 8s → 30s cap). After 8 failed attempts, state goes to `dead` and the renderer surfaces a banner. No silent loss.

### 5.3 Local git as a tracker too

Worktrees, branches, head/base SHA, and ahead/behind aren't fetched from the network — they come from `git2` over the local repo. Same architecture:

- Pull side = `notify` watching `.git/HEAD`, `.git/refs/heads/`, `.git/worktrees/`, `.git/index`.
- Each event triggers a focused refresh (don't rescan the whole repo).
- Diff hunks computed lazily on first request for a `(base_sha, head_sha, path)` triple, cached forever in `diff_file` (SHAs are immutable).

---

## 6. Sidecar working set

The sidecar holds a typed snapshot of the current workspace in memory. It is the source the renderer subscribes to.

### 6.1 Shape

```rust
pub struct WorkingSet {
    pub workspace_id: WorkspaceId,

    // Row tables — concurrent reads, single-task writes.
    pub issues:    DashMap<IssueId,    Arc<Issue>>,
    pub worktrees: DashMap<WorktreeId, Arc<Worktree>>,
    pub prs:       DashMap<PrId,       Arc<Pr>>,
    pub comments:  DashMap<CommentId,  Arc<Comment>>,
    pub checks:    DashMap<CheckId,    Arc<Check>>,
    pub sessions:  DashMap<SessionId,  Arc<AgentSession>>,

    // Indexed views — published as immutable snapshots via ArcSwap so readers
    // never see torn state and never block writers. Rebuilt incrementally.
    pub by_status:    ArcSwap<BTreeMap<NormalizedStatus, Vec<IssueId>>>,
    pub by_assignee:  ArcSwap<HashMap<String, Vec<IssueId>>>,
    pub pr_by_branch: ArcSwap<HashMap<String, PrId>>,
    pub wt_by_path:   ArcSwap<HashMap<PathBuf, WorktreeId>>,

    // Fixed-size ring buffer for the ticker (fast head/tail).
    pub ticker: RwLock<RingBuffer<TickerEvent, 256>>,

    // Per-session agent UI state, rebuilt from agent_event on session resume.
    pub session_view: DashMap<SessionId, Arc<SessionView>>,

    // One per active preview_target. Console + network ring buffers, CDP state.
    // Pure in-memory: lost on sidecar restart, that's fine — they're a debugger view.
    pub previews: DashMap<PreviewTargetId, Arc<PreviewState>>,
}

pub struct PreviewState {
    pub target: PreviewTarget,
    pub status: PreviewStatus,                  // 'starting'|'live'|'error'|'stopped'
    pub debugger: DebuggerState,                // 'attached'|'detached_user_devtools'
    pub console: RwLock<RingBuffer<ConsoleEntry, 1000>>,
    pub network: RwLock<RingBuffer<NetworkEntry, 500>>,
}
```

### 6.2 Subscription bus

Each renderer connection registers one `Subscription` with a predicate (active workspace, active context). On each batched commit:

1. The mutator drains a `dirty: HashSet<EntityRef>`.
2. Each subscription's predicate filters the dirty set.
3. Matching rows are serialized into a single delta frame (msgpack) and pushed.

Predicates are coarse (workspace-scoped + entity-kind whitelist) — the renderer does its own row-level filtering for the active view. That keeps the subscription bus stupidly simple.

### 6.3 Why ArcSwap for indexed views

Sidebar grouping ("issues by status") must be O(1) when the renderer asks. We can't afford to recompute on every read. Options were:
- **`Arc<RwLock<BTreeMap<...>>>`.** Reads block writes and vice versa. Bad under sync bursts.
- **`Arc<Mutex<...>>`.** Worse.
- **`ArcSwap<BTreeMap<...>>`.** Reads = atomic load + clone of the `Arc`, ~5ns. Writes = clone-on-write into a fresh map, then `store`. Single-writer pattern fits because only one task mutates.

Indexed views are rebuilt **incrementally**: on each row mutation we know what bucket changed, so we clone the small affected slice, not the whole map.

### 6.4 Runtime preview (the "browser tab")

Mirrors the POC, scaled up to a tab in this cockpit.

- **Owner of the `WebContentsView`** is Electron main (only main can attach a `WebContentsView`). The renderer tells main "the preview tab is active and its bounds are X" via an IPC method; main shows/hides/positions accordingly.
- **CDP debugger** is attached by main on every `did-finish-load`. It feeds:
  - `Runtime.consoleAPICalled` + `Runtime.exceptionThrown` → `console_buffer` (cap 1000).
  - `Network.requestWillBeSent` / `responseReceived` / `loadingFailed` → `network_buffer` (cap 500).
- **Detach handshake.** Electron only allows one CDP client at a time. When the user opens DevTools, main detaches; the buffers stop filling. On `devtools-closed`, main reattaches. The sidecar exposes this state to the renderer so the UI can show "buffering paused" honestly.
- **Browser-action surface** (same six tools as the POC, served to agents over MCP and to the renderer over JSON-RPC):
  `capture_screenshot`, `get_dom_snapshot`, `execute_script`, `get_console_messages`, `get_network_requests`, `cdp_send`.
  The MCP server child still runs, just spawned from this sidecar binary instead of the POC one. Backchannel TCP wire format is unchanged.
- **Persistence.** Console / network buffers are **not** persisted. They're a live debugger view, and the cost of writing 1k+ entries per dev-server restart to SQLite buys nothing. **Captures the agent actually consumes** (screenshots from `capture_screenshot`, console snapshots from `get_console_messages`) land in `agent_event.payload_json` because they're part of the tool-call result the agent received. Replay of an old session re-shows what the agent saw, even after the live buffer rolled.
- **Multiple preview targets.** Schema supports N (`preview_target.name`); UI MVP is one. Useful later for "compare before/after" or "web vs mobile" side-by-side.

The renderer's `Tab` union gains:

```ts
| (TabKindBase & { kind: 'preview'; previewId: number; icon: 'preview' })
```

Sidecar-side, an active preview tab subscribes to two streams (console / network appends) at a chosen sample rate (default 60 Hz coalesced). When the tab isn't active, the subscription is dropped — buffers keep filling on the sidecar side, but no IPC traffic.

---

## 7. Wire protocol (sidecar ↔ renderer)

Two logical channels, multiplexed over the same stdio pipe:

```
┌─ envelope (5-byte header) ─┬─ body ─────────────────────────┐
│  kind   u8   { 0=BOOT,     │  msgpack (BOOT, DELTA)         │
│              1=DELTA,      │  json    (CALL, RESULT, EVENT) │
│              2=CALL,       │                                │
│              3=RESULT,     │                                │
│              4=EVENT }     │                                │
│  len    u32  body bytes    │                                │
└────────────────────────────┴────────────────────────────────┘
```

`len` is `u32` (big-endian) rather than the more compact `u24`. The two extra bytes per frame are noise next to the typical 50–500 KB bootstrap, and `u24` would cap a single message at 16 MiB — uncomfortably close to a 4K screenshot in `capture_screenshot` results that have to flow through `agent_event` deltas.

### 7.1 Bootstrap (`kind=0`)

One message at renderer connect. Contains the entire active workspace snapshot — issues, worktrees, prs, comments scoped to the active context, ticker tail, ui state. Typical size: 50–500 KB msgpack, decoded in 1–3 ms in the renderer.

```ts
type Bootstrap = {
  workspace: Workspace
  context: { worktreeId?: number, issueId?: number, prId?: number }
  issues: Issue[]
  worktrees: Worktree[]
  prs: Pr[]
  comments: Comment[]
  checks: Check[]
  sessions: AgentSession[]
  ticker: TickerEvent[]
  uiState: Record<string, unknown>
}
```

### 7.2 Delta (`kind=1`)

Tiny, hot-path. Sent on every working-set commit that affects the subscription.

```ts
type Delta = {
  upsert?: { issues?: Issue[], worktrees?: Worktree[], prs?: Pr[],
             comments?: Comment[], checks?: Check[], sessions?: AgentSession[] }
  remove?: { issues?: number[], worktrees?: number[], prs?: number[],
             comments?: number[], checks?: number[], sessions?: number[] }
  ticker?: { append: TickerEvent[] }
  agentEvents?: { sessionId: number, events: AgentEvent[] }   // append-only stream

  // Preview tab live tail — only sent while the preview tab is active.
  previewLog?: {
    previewId: number,
    console?: { append: ConsoleEntry[] },
    network?: { append: NetworkEntry[] },
    status?: PreviewStatus,
    debugger?: DebuggerState,
  }

  uiState?: Record<string, unknown>
}
```

`agentEvents` is the firehose during a chat. Coalesced server-side: `chunk` events for the same assistant turn are merged into one delta per ~16 ms tick so the renderer paints at 60 Hz, not 600 Hz.

### 7.3 Call / Result (`kind=2/3`)

JSON-RPC-shaped, correlation id, for user actions.

```ts
type Call =
  | { id: number, method: 'comment.create',  params: { issueId: number, body: string } }
  | { id: number, method: 'issue.setStatus', params: { issueId: number, status: NormalizedStatus } }
  | { id: number, method: 'worktree.add',    params: { branch: string, base?: string, issueId?: number } }
  | { id: number, method: 'context.set',     params: { worktreeId?: number, issueId?: number, prId?: number } }
  | { id: number, method: 'session.send',    params: { sessionId: number, text: string } }
  | { id: number, method: 'session.cancel',  params: { sessionId: number } }
  | { id: number, method: 'search.issues',   params: { q: string, limit: number } }

  // Preview tab — same tools the agents have, callable by the user
  | { id: number, method: 'preview.bounds',     params: { previewId: number, rect: { x: number, y: number, w: number, h: number } | null } }
  | { id: number, method: 'preview.reload',     params: { previewId: number } }
  | { id: number, method: 'preview.navigate',   params: { previewId: number, url: string } }
  | { id: number, method: 'preview.devtools',   params: { previewId: number, open: boolean } }
  | { id: number, method: 'preview.screenshot', params: { previewId: number } }
  | { id: number, method: 'preview.evalScript', params: { previewId: number, script: string } }
  | { id: number, method: 'preview.cdpSend',    params: { previewId: number, method: string, params?: object } }
  | … // grows over time
```

Mutations always come back with the resulting deltas already applied — the renderer doesn't need to optimistically merge a Result into its store.

### 7.4 Event (`kind=4`)

Out-of-band notifications that don't fit the delta model: provider auth expired, sync failure, outbox dead-letter, schema migration in progress.

### 7.5 Why two encodings

- **msgpack for hot path** (BOOT, DELTA) — 2–4× smaller than JSON, decodes ~3× faster, and avoids a bunch of `Date`/`number`/`string` re-coercion in TS. Use `@msgpack/msgpack` (zero deps) on the renderer side, `rmp-serde` on the sidecar side.
- **JSON for control plane** (CALL, RESULT, EVENT) — debuggable, low-frequency, payload size doesn't matter.

---

## 8. Renderer store

Single TS module under `@/store/`. No Redux, no Zustand.

```ts
// @/store/store.ts
const issues  = new Map<number, Issue>()
const byStatus = new Map<NormalizedStatus, Set<number>>()
// etc.

type Listener = () => void
const listeners = new Set<Listener>()

export function applyDelta(d: Delta) {
  // mutate maps in place, then notify
  if (d.upsert?.issues) for (const i of d.upsert.issues) upsertIssue(i)
  if (d.remove?.issues) for (const id of d.remove.issues) removeIssue(id)
  // …
  for (const l of listeners) l()
}

export function subscribe(l: Listener) {
  listeners.add(l); return () => listeners.delete(l)
}
```

Components consume via `useSyncExternalStore` with a *selector*:

```ts
export function useIssuesByStatus(status: NormalizedStatus) {
  return useSyncExternalStore(
    subscribe,
    () => Array.from(byStatus.get(status) ?? []).map(id => issues.get(id)!),
    () => []  // SSR; not used here
  )
}
```

The selector returns the same array reference until the underlying set changes, so React's bail-out kicks in. For lists, components render with a stable id-keyed map so virtualization (react-virtual / handrolled) works without thrashing.

### 8.1 Why not just keep using fixtures + `useState`?

Fixtures don't scale. `useState` for thousands of issues is fine *if* nothing changes, but the moment sync deltas come in, naive setState in a tree of 50 components fans out into 50 re-renders. The split — global store + per-selector subscriptions — keeps re-renders tightly scoped to what actually changed.

---

## 9. Performance budgets

Numbers are the target the design must hit. If we miss, we profile, not redesign.

| Operation | Target | Bottleneck if violated |
|---|---:|---|
| Renderer cold start → interactive | < 200 ms | bootstrap msgpack size, decode |
| Tab switch (already loaded) | < 1 frame (16 ms) | renderer selectors |
| Sidebar scroll, 5k issues | 60 fps | virtualization, selector stability |
| Issue → diff tab open (cached) | < 50 ms | diff_file lookup + zstd decompress |
| Issue → diff tab open (cold) | < 500 ms | git2 diff |
| Agent event → on-screen bubble | < 32 ms (2 frames) | delta coalescing window, paint |
| Comment post → optimistic show | < 16 ms | outbox INSERT path |
| Sync delta (100 issues) | < 100 ms end-to-end | tracker pagination, working-set merge |
| FTS issue search (1k matches) | < 30 ms | FTS5 ranking |

### 9.1 What makes it actually fast

1. **Frontload one bootstrap** — single decode, single working-set hydrate. No N+1 IPC.
2. **Stay in process for reads** — renderer never does IPC during a render. Selectors are map lookups.
3. **Msgpack on the hot wire** — JSON.parse is the largest single cost in naive Electron apps with chatty IPC.
4. **`PRAGMA mmap_size = 2G` + 256 MB cache** — SQLite reads usually hit OS page cache → ~5 µs.
5. **WAL** — readers never block writers. Sync engine and outbox can hammer the DB while the renderer pulls deltas.
6. **Coalesce tool-call events** — group by `tool_call_id` server-side; renderer sees one card, not 30 increments.
7. **Pre-compress diff hunks (zstd)** — disk + cache go further; decompress is faster than parsing unified-diff text.
8. **Pre-render comment HTML** — store `body_html` next to `body_md` so the renderer doesn't re-render markdown on every paint.
9. **Indexed views via ArcSwap** — sidebar grouping is a pointer load, not a map walk.
10. **Single-writer per cache line** — `DashMap` shards by row, no global lock contention even under 50 events/s.

### 9.2 Honest costs of being in Electron

We can't beat physics. The renderer is V8 and the DOM. Mitigations:
- Bulk-update the DOM via React 18's automatic batching; don't `flushSync` in deltas.
- Keep the DOM tree shallow — flatten group/list components, avoid 5-level wrappers per row.
- For ticker / agent feed (high-frequency append), use `requestAnimationFrame` to coalesce paints; don't render mid-frame.

If we ever genuinely outgrow this, the next step isn't "optimize Electron" — it's render the cockpit in a Tauri WebView (smaller V8) or a native shell. Out of scope.

---

## 10. Observability

The sidecar emits structured `tracing` events to stderr; main collects them into a rolling `~/Library/Logs/Versaflow/sidecar.log`. A `dev` build also exposes a `/diag` JSON-RPC endpoint:

- Working-set sizes per table.
- Sync watermarks per provider/resource.
- Outbox depth + last failure.
- p50/p95/p99 of every IPC method.
- Last 1000 deltas with size and latency.

These are the numbers we'll regret not having the first time something is "slow" in production.

---

## 11. Crates I'd pick (Rust sidecar)

| Crate | Why |
|---|---|
| `rusqlite` (`bundled`, `serde_json`, `blob`) | Embedded SQLite, no system dep |
| `tokio` (already used) | Async runtime |
| `tokio-tungstenite` | Linear GraphQL subs |
| `reqwest` (`rustls-tls`, `gzip`) | HTTP for tracker APIs |
| `rmp-serde` | Msgpack hot wire |
| `serde`, `serde_json` (already used) | Control plane |
| `dashmap` | Concurrent row maps |
| `arc-swap` | Atomic indexed-view publication |
| `git2` (libgit2) **or** `gix` | Worktree + diff. Lean toward `gix` for speed and pure-rust, but `git2` is more battle-tested. **Decision pending** — see open questions. |
| `notify` | Filesystem watch |
| `keyring` | OS keychain for tokens |
| `tracing` + `tracing-subscriber` | Structured logs |
| `zstd` | Diff hunk compression |
| `governor` | Rate-limiting tracker calls |
| `pulldown-cmark` | Markdown → HTML for `comment.body_html` ingest pipeline |
| `ammonia` | HTML sanitizer running over the cmark output before persist (see §3.3) |
| `uuid` | `client_op_id` generation for outbox idempotency |

---

## 12. Migration path from the current static prototype

The renderer fixtures (`src/renderer/src/data/`) map cleanly to the schema:

| Fixture | Becomes |
|---|---|
| `data/issues.ts` `ISSUES_BY_STATUS` | `issue` rows + `by_status` index |
| `data/agents.ts` `AGENTS` | `agent_session` rows (steady state derived from `agent_event`) |
| `data/files.ts` `FILES`, `FILE_HUNKS` | `diff_file` rows |
| `data/pr.tsx` `PR_DATA`, `PR_CHECKS` | `pr` + `pr_check` + `comment(parent_kind='pr')` |
| `data/comments.tsx` `OV_COMMENTS`, `ISSUE_COMMENTS` | `comment` rows (`parent_kind='review'` and `'issue'`) |
| `data/chat.tsx` `CHAT_BY_AGENT` | `agent_session` + `agent_event` (replayed → `SessionView`) |
| `data/ticker.tsx` `BASE_TICKER`, `LIVE_EVENTS` | `ticker_event` rows |
| _(none today)_ — preview tab missing in renderer | `preview_target` row + sidecar `PreviewState`; renderer gains `Tab.kind='preview'` |

Suggested rollout:

1. **Land the schema + sidecar boot** — empty DB, no providers, no UI changes. Sidecar prints "ready" to stderr.
2. **Wire bootstrap + delta IPC** — one fixture (`issues`) flows from sidecar instead of `data/issues.ts`. Fall back to fixtures for the rest. This is where the wire protocol earns its keep or doesn't.
3. **Linear provider** — full sync, then delta polling, then GraphQL subs. UI now lives off real Linear data.
4. **Local git provider** — worktrees, branches, diffs. Compare tab and Diff tab go live.
5. **GitHub provider** — PRs, checks, comments. PR tab goes live.
6. **Outbox** — comment.create as the first mutation; iterate from there.
7. **ACP integration** — the POC's chat sidecar moves into this sidecar's process; `agent_event` table replaces the in-memory ring; chat tabs become real.
8. **Manual provider + standalone worktrees** — UX for "no tracker, just code".

Each step is independently shippable. The renderer stays mounted; tabs swap their data source from fixture import → store selector one at a time.

### 12.1 Renderer type changes

Today's renderer types (`src/renderer/src/types/index.ts`) overload identifiers in ways that won't survive a real backend. Most painfully, `Issue.id` is currently a `string` like `"VF-1284"` — that's the human-readable tracker key, not a stable id. Under the new model that splits into three:

```ts
type Issue = {
  id:          number   // local SQLite rowid; stable across renames, primary key in the renderer store
  externalId:  string   // tracker node id (Linear UUID, GitHub node id) — the API call key
  externalKey: string   // tracker-facing slug like "VF-1284" or "owner/repo#123" — what we display
  // …
}
```

The cockpit's read path keys off `id` everywhere (selectors, tab `params.issueId`, comment `parent_id`). `externalKey` is presentation only. Mutations to remote APIs use `externalId`. This is the single biggest rename when fixtures get retired — anywhere a string key is currently passed around (e.g. tab params, sidebar selection, PR ↔ issue links), it becomes a `number`. Worth doing the type rename in step 1 of the rollout, even before any IPC, so subsequent steps don't keep paying for the conversion.

The same shape applies to `Pr` (`id: number`, `externalId: string`, `number: number` for the human-facing `#123`) and `Comment` (`id: number`, `externalId: string | null`, `clientOpId: string | null`).

---

## 13. Open questions / things I want to confirm with you

These are the places where I'd rather ask once than bake the wrong assumption in:

1. **Multi-workspace at MVP, or one-workspace-per-instance?** Schema supports many; UI today shows one. Cheap to keep multi-workspace; costs maybe a day of "switch workspace" UX.
2. **GitHub status mapping default.** I propose: `open + label:status:in-progress → in_progress`, `open + label:status:in-review → in_review`, else `open → todo`, `closed (merged-PR linked) → done`, `closed (no PR) → cancelled`. Reasonable, or do you want Projects v2 columns from day one?
3. **`git2` vs `gix`.** `gix` is the future and ~2× faster on cold ops, but its worktree story is younger. I lean `git2` for MVP. OK?
4. **Diff cache eviction.** `diff_file` is keyed by SHA pair, so it's correct forever, but unbounded. Propose: prune entries whose `(base_sha, head_sha)` are no longer reachable from any branch/PR/worktree, run on a daily timer.
5. **Sensitive content in `payload_json`.** Linear payloads can include user emails, etc. Fine in plaintext for the local user, or do we want a redaction pass before persist?
6. **Outbox semantics for "issue.setStatus".** If the user moves an issue locally and the tracker rejects (permissions changed), do we revert the local state silently or surface a conflict prompt? I lean conflict prompt — silent revert breaks the optimistic UX contract.
7. **Token storage scope.** OS keychain per provider, or one keychain entry per workspace? Per workspace lets you scope a single GH token to one project; per provider is simpler. I lean per workspace.
8. **Agent event retention.** A long session is ~50k events. SQLite is happy with that, but a year of sessions isn't. Propose: keep raw events for 30 days, then prune to the latest `agent_session_snapshot`. Does that match how you'd want to revisit old runs?
9. **Preview lifecycle.** Should the sidecar *spawn* the dev server (`preview_target.start_cmd`) and own its lifetime, or just attach to whatever's running on `url`? POC attaches only — assumes the user runs `pnpm dev` themselves. Spawning is nicer UX (one click → preview live) but the failure modes (port conflicts, watch crashes, stale processes after kill) are real work. I lean attach-only for MVP, with `start_cmd` reserved as a column for later.
10. **Preview pane scope.** One preview per workspace, or one per worktree? Per-worktree maps cleanly when each worktree has its own dev server (different ports per branch), but that's not always how teams run things. I lean per-workspace for MVP, with the schema already supporting per-workspace `preview_target` rows so we can scale later.

---

## 14. Summary

- **SQLite + WAL + mmap** as the system of record. Hand-written SQL via `rusqlite`. ~30 normalized tables + FTS5 + JSON1.
- **Rust sidecar working set** (`DashMap` + `ArcSwap`) holds the live snapshot, indexed for the renderer's exact query shapes.
- **Renderer normalized store** hydrated by one bootstrap msgpack frame, kept fresh by tiny deltas. No SQL in the renderer, ever.
- **Provider trait** abstracts Linear/GitHub/manual. Status normalization is configurable per-provider via a mapping table.
- **Worktree is first-class** with `issue_id` nullable. The cockpit's read path keys off worktree, not issue.
- **Offline-first writes** via outbox. Optimistic local mutations, exponential-backoff replication, conflict surfaced not swallowed.
- **Runtime preview is a real tab.** WebContentsView owned by main, console/network ring buffers in the sidecar, MCP browser-action surface unchanged from the POC, persisted captures land in `agent_event` so old sessions replay cleanly.
- **Performance is enforced by budgets**, not aesthetics. Frame-budget reads, msgpack hot wire, coalesced events, pre-rendered comment HTML, zstd diffs.

Primeagen would still tell us to rewrite the renderer in Zig, but he'd at least admit the data layer isn't where the time goes.
