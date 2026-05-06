import type { IssueGroup, IssueStatus } from '@/types';

// Linear statuses: backlog, todo, in_progress, in_review, in_verification, done, cancelled
export const ISSUES_BY_STATUS: IssueGroup[] = [
  {
    title: 'Backlog',
    key: 'backlog',
    items: [
      { id: 'VF-1310', text: 'Durable websocket reconnect', stat: 'backlog', wt: 'none' },
    ],
  },
  {
    title: 'Todo',
    key: 'todo',
    items: [
      { id: 'VF-1301', text: 'Surface stripe error codes in toast', stat: 'todo', agents: ['c', 'c', 'c'], wt: 'none' },
      { id: 'VF-1299', text: 'Migrate legacy auth middleware', stat: 'todo', agents: ['c', 'c'], wt: 'worktree', branch: 'vf-1299-auth-mw' },
      { id: 'VF-1298', text: 'Pricing page — annual toggle', stat: 'todo', agents: ['c'], wt: 'none' },
    ],
  },
  {
    title: 'In Progress',
    key: 'in_progress',
    live: true,
    items: [
      {
        id: 'VF-1284',
        text: 'Refactor billing reducer',
        stat: 'in_progress',
        agents: ['c', 'x', 'g'],
        spark: [3, 5, 7, 4, 6, 9, 8, 7, 6, 8, 9, 11, 10, 9, 12, 14, 11, 9, 13, 15],
        hot: 16,
        selected: true,
        wt: 'worktree',
        branch: 'vf-1284-refactor-billing-reducer',
        worktrees: ['vf-1284-refactor-billing-reducer', 'vf-1284-spike-immer', 'vf-1284-rtk-experiment'],
      },
      {
        id: 'VF-1290',
        text: 'Add team invites to onboarding',
        stat: 'in_progress',
        agents: ['c', 'x'],
        spark: [2, 3, 3, 5, 4, 6, 5, 7, 6, 8, 7, 9, 8, 7, 9],
        hot: 12,
        wt: 'pr',
        pr: 4131,
        prState: 'open',
        checks: 'pass',
        prs: [
          { pr: 4131, prState: 'open', checks: 'pass' },
          { pr: 4135, prState: 'open', checks: 'pending' },
        ],
      },
      {
        id: 'VF-1276',
        text: 'Fix flaky webhook retry test',
        stat: 'in_progress',
        agents: ['c'],
        spark: [1, 2, 2, 3, 4, 3, 5, 4, 3, 4, 5, 4],
        hot: 6,
        wt: 'worktree',
        branch: 'vf-1276-flaky-webhook',
        worktrees: ['vf-1276-flaky-webhook', 'vf-1276-retry-jitter'],
      },
    ],
  },
  {
    title: 'In Review',
    key: 'in_review',
    items: [
      { id: 'VF-1281', text: 'Cache invalidation on profile edit', stat: 'in_review', agents: ['x'], wt: 'pr', pr: 4128, prState: 'open', checks: 'pending' },
      { id: 'VF-1273', text: 'Webhook signature rotation', stat: 'in_review', agents: ['c'], wt: 'pr', pr: 4119, prState: 'review', checks: 'fail' },
    ],
  },
  {
    title: 'In verification',
    key: 'in_verification',
    items: [
      { id: 'VF-1271', text: 'Soft-delete audit trail', stat: 'in_verification', wt: 'pr', pr: 4112, prState: 'review', checks: 'pass' },
    ],
  },
  {
    title: 'Done',
    key: 'done',
    items: [
      { id: 'VF-1268', text: 'Trim trial banner copy', stat: 'done', wt: 'pr', pr: 4099, prState: 'merged', checks: 'pass' },
      { id: 'VF-1265', text: 'Pull /metrics route off the hot path', stat: 'done', wt: 'pr', pr: 4093, prState: 'merged', checks: 'pass' },
    ],
  },
];

export const STATUSES: IssueStatus[] = [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'in_verification',
  'done',
  'cancelled',
];

export interface StatusMeta {
  label: string;
  color: string;
  ring: number;
  filled?: boolean;
  x?: boolean;
}

export const STATUS_META: Record<IssueStatus, StatusMeta> = {
  backlog:         { label: 'Backlog',         color: 'var(--vf-ink-500)',    ring: 0.0 },
  todo:            { label: 'Todo',            color: 'var(--vf-ink-300)',    ring: 0.0 },
  in_progress:     { label: 'In Progress',     color: 'oklch(0.78 0.16 75)',  ring: 0.5 },
  in_review:       { label: 'In Review',       color: 'oklch(0.72 0.18 320)', ring: 0.7 },
  in_verification: { label: 'In verification', color: 'var(--vf-teal-400)',   ring: 0.85 },
  done:            { label: 'Done',            color: 'var(--vf-teal-400)',   ring: 1.0, filled: true },
  cancelled:       { label: 'Cancelled',       color: 'var(--vf-ink-600)',    ring: 1.0, filled: true, x: true },
};
