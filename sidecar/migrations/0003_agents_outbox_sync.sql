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
