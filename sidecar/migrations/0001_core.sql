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
