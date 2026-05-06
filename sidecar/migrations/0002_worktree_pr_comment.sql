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
