import { useSyncExternalStore } from 'react';
import type { IssueStatus, Workspace, Worktree } from '@/types';
import type {
  AgentSessionRow,
  BootSnapshot,
  CheckRow,
  CommentRow,
  Delta,
  IssueRow,
  PrRow,
  TickerEventRow,
} from './protocol';

type Listener = () => void;

interface StoreState {
  workspace: Workspace | null;
  context: { worktreeId?: number; issueId?: number; prId?: number };
  issues: Map<number, IssueRow>;
  worktrees: Map<number, Worktree>;
  prs: Map<number, PrRow>;
  comments: Map<number, CommentRow>;
  prChecks: Map<number, CheckRow>;
  agentSessions: Map<number, AgentSessionRow>;
  issuesByStatus: Map<IssueStatus, Set<number>>;
  prsByBranch: Map<string, number>;
  worktreesByPath: Map<string, number>;
  ticker: TickerEventRow[];
  uiState: Record<string, unknown>;
}

const state: StoreState = {
  workspace: null,
  context: {},
  issues: new Map(),
  worktrees: new Map(),
  prs: new Map(),
  comments: new Map(),
  prChecks: new Map(),
  agentSessions: new Map(),
  issuesByStatus: new Map(),
  prsByBranch: new Map(),
  worktreesByPath: new Map(),
  ticker: [],
  uiState: {},
};

// Per-collection mutation counters. Selector caches invalidate when the
// counter for the collection they read advances. Cheaper than copy-on-write
// at the Map level; coarser than per-key tracking, which we don't need.
const versions = {
  issues: 0,
  worktrees: 0,
  prs: 0,
  comments: 0,
  prChecks: 0,
  agentSessions: 0,
  ticker: 0,
  workspace: 0,
  context: 0,
  uiState: 0,
};

const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function notify(): void {
  for (const l of listeners) l();
}

// ── Index helpers ──────────────────────────────────────────────────────
// Index entries are immutable: replace the affected Set with a new instance
// on every change so selectors can memoize on identity (per the issue).

function indexAddIssue(row: IssueRow): void {
  const prev = state.issuesByStatus.get(row.status);
  const next = prev ? new Set(prev) : new Set<number>();
  next.add(row.id);
  state.issuesByStatus.set(row.status, next);
}

function indexRemoveIssueFromStatus(status: IssueStatus, id: number): void {
  const prev = state.issuesByStatus.get(status);
  if (!prev || !prev.has(id)) return;
  if (prev.size === 1) {
    state.issuesByStatus.delete(status);
    return;
  }
  const next = new Set(prev);
  next.delete(id);
  state.issuesByStatus.set(status, next);
}

function upsertIssue(row: IssueRow): void {
  const old = state.issues.get(row.id);
  if (old && old.status !== row.status) {
    indexRemoveIssueFromStatus(old.status, row.id);
    indexAddIssue(row);
  } else if (!old) {
    indexAddIssue(row);
  }
  state.issues.set(row.id, row);
  versions.issues++;
}

function removeIssue(id: number): void {
  const old = state.issues.get(id);
  if (!old) return;
  indexRemoveIssueFromStatus(old.status, id);
  state.issues.delete(id);
  versions.issues++;
}

function upsertWorktree(row: Worktree): void {
  const old = state.worktrees.get(row.id);
  if (old && old.path !== row.path) state.worktreesByPath.delete(old.path);
  state.worktrees.set(row.id, row);
  state.worktreesByPath.set(row.path, row.id);
  versions.worktrees++;
}

function removeWorktree(id: number): void {
  const old = state.worktrees.get(id);
  if (!old) return;
  if (state.worktreesByPath.get(old.path) === id) {
    state.worktreesByPath.delete(old.path);
  }
  state.worktrees.delete(id);
  versions.worktrees++;
}

function upsertPr(row: PrRow): void {
  const old = state.prs.get(row.id);
  if (old && old.headBranch !== row.headBranch) state.prsByBranch.delete(old.headBranch);
  state.prs.set(row.id, row);
  state.prsByBranch.set(row.headBranch, row.id);
  versions.prs++;
}

function removePr(id: number): void {
  const old = state.prs.get(id);
  if (!old) return;
  if (state.prsByBranch.get(old.headBranch) === id) {
    state.prsByBranch.delete(old.headBranch);
  }
  state.prs.delete(id);
  versions.prs++;
}

// ── Public mutation API ────────────────────────────────────────────────

export function hydrate(boot: BootSnapshot): void {
  state.workspace = boot.workspace;
  state.context = { ...boot.context };
  state.issues.clear();
  state.worktrees.clear();
  state.prs.clear();
  state.comments.clear();
  state.prChecks.clear();
  state.agentSessions.clear();
  state.issuesByStatus.clear();
  state.prsByBranch.clear();
  state.worktreesByPath.clear();
  state.ticker = [];
  state.uiState = { ...boot.uiState };

  for (const row of boot.issues) upsertIssue(row);
  for (const row of boot.worktrees) upsertWorktree(row);
  for (const row of boot.prs) upsertPr(row);
  for (const row of boot.comments) { state.comments.set(row.id, row); versions.comments++; }
  for (const row of boot.checks) { state.prChecks.set(row.id, row); versions.prChecks++; }
  for (const row of boot.sessions) { state.agentSessions.set(row.id, row); versions.agentSessions++; }
  state.ticker = [...boot.ticker];

  versions.ticker++;
  versions.workspace++;
  versions.context++;
  versions.uiState++;

  notify();
}

export function applyDelta(d: Delta): void {
  if (d.upsert?.issues) for (const r of d.upsert.issues) upsertIssue(r);
  if (d.upsert?.worktrees) for (const r of d.upsert.worktrees) upsertWorktree(r);
  if (d.upsert?.prs) for (const r of d.upsert.prs) upsertPr(r);
  if (d.upsert?.comments) {
    for (const r of d.upsert.comments) state.comments.set(r.id, r);
    versions.comments++;
  }
  if (d.upsert?.checks) {
    for (const r of d.upsert.checks) state.prChecks.set(r.id, r);
    versions.prChecks++;
  }
  if (d.upsert?.sessions) {
    for (const r of d.upsert.sessions) state.agentSessions.set(r.id, r);
    versions.agentSessions++;
  }

  if (d.remove?.issues) for (const id of d.remove.issues) removeIssue(id);
  if (d.remove?.worktrees) for (const id of d.remove.worktrees) removeWorktree(id);
  if (d.remove?.prs) for (const id of d.remove.prs) removePr(id);
  if (d.remove?.comments) {
    for (const id of d.remove.comments) state.comments.delete(id);
    versions.comments++;
  }
  if (d.remove?.checks) {
    for (const id of d.remove.checks) state.prChecks.delete(id);
    versions.prChecks++;
  }
  if (d.remove?.sessions) {
    for (const id of d.remove.sessions) state.agentSessions.delete(id);
    versions.agentSessions++;
  }

  if (d.ticker?.append?.length) {
    state.ticker = [...d.ticker.append, ...state.ticker];
    versions.ticker++;
  }
  if (d.uiState) {
    state.uiState = { ...state.uiState, ...d.uiState };
    versions.uiState++;
  }

  notify();
}

// ── Imperative getters (also used by selectors and tests) ─────────────

export function getWorkspace(): Workspace | null { return state.workspace; }
export function getContext(): StoreState['context'] { return state.context; }
export function getIssue(id: number): IssueRow | undefined { return state.issues.get(id); }
export function getWorktree(id: number): Worktree | undefined { return state.worktrees.get(id); }
export function getPr(id: number): PrRow | undefined { return state.prs.get(id); }
export function getTicker(): readonly TickerEventRow[] { return state.ticker; }

const issuesByStatusArrCache = new Map<IssueStatus, { set: Set<number> | undefined; arr: IssueRow[] }>();

export function getIssuesByStatus(status: IssueStatus): IssueRow[] {
  const set = state.issuesByStatus.get(status);
  const cached = issuesByStatusArrCache.get(status);
  if (cached && cached.set === set) return cached.arr;
  const arr: IssueRow[] = [];
  if (set) {
    for (const id of set) {
      const row = state.issues.get(id);
      if (row) arr.push(row);
    }
  }
  issuesByStatusArrCache.set(status, { set, arr });
  return arr;
}

let worktreesCache: { v: number; arr: Worktree[] } = { v: -1, arr: [] };
export function getWorktrees(): Worktree[] {
  if (worktreesCache.v === versions.worktrees) return worktreesCache.arr;
  worktreesCache = { v: versions.worktrees, arr: Array.from(state.worktrees.values()) };
  return worktreesCache.arr;
}

// ── React hooks ────────────────────────────────────────────────────────

export function useWorkspace(): Workspace | null {
  return useSyncExternalStore(subscribe, getWorkspace);
}

export function useIssue(id: number): IssueRow | undefined {
  return useSyncExternalStore(subscribe, () => getIssue(id));
}

export function useIssuesByStatus(status: IssueStatus): IssueRow[] {
  return useSyncExternalStore(subscribe, () => getIssuesByStatus(status));
}

export function useWorktrees(): Worktree[] {
  return useSyncExternalStore(subscribe, getWorktrees);
}

export function usePr(id: number): PrRow | undefined {
  return useSyncExternalStore(subscribe, () => state.prs.get(id));
}

export type { BootSnapshot, Delta } from './protocol';
