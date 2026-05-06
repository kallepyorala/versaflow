-- Cockpit-fixture-equivalent seed (issue #19). This migration mirrors the
-- pre-store renderer fixtures so the cockpit looks identical against an
-- empty db. It is intentionally numbered 0099 so it stays last and can be
-- swapped out for a real bootstrap path later.

-- ── Provider + workspace ───────────────────────────────────────────────

INSERT INTO provider (id, kind, name, account_id, config_json, added_at) VALUES
  (1, 'linear', 'acme-co', 'acme', '{}', 0);

INSERT INTO workspace (id, name, root_path, default_provider_id, default_branch, active_context_json) VALUES
  (1, 'acme-web', '~/Projects/acme/web', 1, 'main', '{"issueId":1284,"worktreeId":101}');

INSERT INTO workspace_provider (workspace_id, provider_id, role) VALUES
  (1, 1, 'issues');

-- ── Status mapping (Linear's labels → canonical) ──────────────────────

INSERT INTO status_map (workspace_id, provider_id, raw_status, normalized) VALUES
  (1, 1, 'Backlog',         'backlog'),
  (1, 1, 'Todo',             'todo'),
  (1, 1, 'In Progress',      'in_progress'),
  (1, 1, 'In Review',        'in_review'),
  (1, 1, 'In verification',  'in_verification'),
  (1, 1, 'Done',             'done'),
  (1, 1, 'Cancelled',        'cancelled');

-- ── Issues (synthetic numeric ids match the pre-store fixture) ────────

INSERT INTO issue (id, workspace_id, provider_id, external_id, external_key, title, status, fetched_at) VALUES
  (1310, 1, 1, 'lin_uuid_1310', 'VF-1310', 'Durable websocket reconnect',         'backlog',         0),
  (1301, 1, 1, 'lin_uuid_1301', 'VF-1301', 'Surface stripe error codes in toast', 'todo',            0),
  (1299, 1, 1, 'lin_uuid_1299', 'VF-1299', 'Migrate legacy auth middleware',      'todo',            0),
  (1298, 1, 1, 'lin_uuid_1298', 'VF-1298', 'Pricing page — annual toggle',        'todo',            0),
  (1284, 1, 1, 'lin_uuid_1284', 'VF-1284', 'Refactor billing reducer',            'in_progress',     0),
  (1290, 1, 1, 'lin_uuid_1290', 'VF-1290', 'Add team invites to onboarding',      'in_progress',     0),
  (1276, 1, 1, 'lin_uuid_1276', 'VF-1276', 'Fix flaky webhook retry test',        'in_progress',     0),
  (1281, 1, 1, 'lin_uuid_1281', 'VF-1281', 'Cache invalidation on profile edit',  'in_review',       0),
  (1273, 1, 1, 'lin_uuid_1273', 'VF-1273', 'Webhook signature rotation',          'in_review',       0),
  (1271, 1, 1, 'lin_uuid_1271', 'VF-1271', 'Soft-delete audit trail',             'in_verification', 0),
  (1268, 1, 1, 'lin_uuid_1268', 'VF-1268', 'Trim trial banner copy',              'done',            0),
  (1265, 1, 1, 'lin_uuid_1265', 'VF-1265', 'Pull /metrics route off the hot path','done',            0);

-- ── Worktrees for VF-1284 (matches the renderer fixture from #4) ──────

INSERT INTO worktree
  (id, workspace_id, issue_id, path, branch, base_branch, base_sha, head_sha, ahead, behind, is_active, origin, created_at, last_seen_at)
VALUES
  (101, 1, 1284, '~/Projects/acme/worktrees/vf-1284-refactor-billing-reducer', 'vf-1284-refactor-billing-reducer', 'main', 'a3f7c12', 'e2b9510', 6, 0, 1, 'manual', 0, 0),
  (102, 1, 1284, '~/Projects/acme/worktrees/vf-1284-spike-immer',              'vf-1284-spike-immer',              'main', 'a3f7c12', '8e2b09d', 2, 0, 0, 'agent',  0, 0),
  (103, 1, 1284, '~/Projects/acme/worktrees/vf-1284-rtk-experiment',           'vf-1284-rtk-experiment',           'main', 'a3f7c12', 'd1c4f88', 4, 1, 0, 'agent',  0, 0);
