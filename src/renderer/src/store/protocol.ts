import type { IssueStatus, Workspace, Worktree } from '@/types';

// Wire shapes mirroring DATA-MODEL.md §3.2 columns. These are the rows that
// flow through the BOOT (msgpack) and DELTA (msgpack) channels — distinct
// from the React-flavored fixture types in `@/types`.

export type PrState = 'open' | 'closed' | 'merged' | 'draft';
export type PrReviewState = 'pending' | 'approved' | 'changes_requested' | 'review';
export type PrChecksRollup = 'pass' | 'pending' | 'fail';
export type CheckState = 'pass' | 'fail' | 'run' | 'skip' | 'queued';
export type CommentParentKind = 'issue' | 'pr' | 'review';
export type CommentStatus = 'open' | 'addressed' | 'stale';
export type AgentSessionState = 'active' | 'leading' | 'errored' | 'idle';
export type TickerKind = 'now' | 'ok' | 'tealed' | 'fail';

export interface IssueRow {
  id: number;
  workspaceId: number;
  providerId: number;
  externalId: string;
  externalKey: string | null;
  title: string;
  bodyMd: string | null;
  status: IssueStatus;
  statusRaw: string | null;
  priority: number | null;
  assigneeExternalId: string | null;
  assigneeName: string | null;
  url: string | null;
  hot: number | null;
  archived: boolean;
  updatedAtRemote: number | null;
  fetchedAt: number;
}

export interface PrRow {
  id: number;
  workspaceId: number;
  providerId: number;
  externalId: string;
  number: number;
  title: string;
  bodyMd: string | null;
  state: PrState;
  reviewState: PrReviewState | null;
  checksState: PrChecksRollup | null;
  baseBranch: string;
  headBranch: string;
  baseSha: string | null;
  headSha: string | null;
  authorExternalId: string | null;
  authorName: string | null;
  url: string | null;
  diffAdded: number | null;
  diffRemoved: number | null;
  diffFiles: number | null;
  updatedAtRemote: number | null;
  fetchedAt: number;
}

export interface CommentRow {
  id: number;
  workspaceId: number;
  parentKind: CommentParentKind;
  parentId: number;
  externalId: string | null;
  clientOpId: string | null;
  authorExternalId: string | null;
  authorName: string | null;
  authorRole: string | null;
  isAgent: boolean;
  bodyMd: string;
  bodyHtml: string | null;
  status: CommentStatus | null;
  filePath: string | null;
  line: number | null;
  createdAtRemote: number | null;
  fetchedAt: number;
}

export interface CheckRow {
  id: number;
  prId: number;
  name: string;
  source: string;
  state: CheckState;
  required: boolean;
  durationMs: number | null;
  errorText: string | null;
  externalId: string | null;
  fetchedAt: number;
}

export interface AgentSessionRow {
  id: number;
  workspaceId: number;
  issueId: number | null;
  worktreeId: number | null;
  prId: number | null;
  agentKind: string;
  model: string | null;
  state: AgentSessionState;
  cwd: string;
  startedAt: number;
  endedAt: number | null;
  stopReason: string | null;
}

export interface TickerEventRow {
  id: number;
  workspaceId: number;
  ts: number;
  kind: TickerKind;
  issueKey: string | null;
  agentKind: string | null;
  bodyMd: string;
}

export interface BootSnapshot {
  // Null until the user has configured at least one workspace; once seeded
  // (issue #19) the sidecar populates it from `workspace` table.
  workspace: Workspace | null;
  context: { worktreeId?: number; issueId?: number; prId?: number };
  issues: IssueRow[];
  worktrees: Worktree[];
  prs: PrRow[];
  comments: CommentRow[];
  checks: CheckRow[];
  sessions: AgentSessionRow[];
  ticker: TickerEventRow[];
  uiState: Record<string, unknown>;
}

export interface Delta {
  upsert?: {
    issues?: IssueRow[];
    worktrees?: Worktree[];
    prs?: PrRow[];
    comments?: CommentRow[];
    checks?: CheckRow[];
    sessions?: AgentSessionRow[];
  };
  remove?: {
    issues?: number[];
    worktrees?: number[];
    prs?: number[];
    comments?: number[];
    checks?: number[];
    sessions?: number[];
  };
  ticker?: { append: TickerEventRow[] };
  uiState?: Record<string, unknown>;
}
