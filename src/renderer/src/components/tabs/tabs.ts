import type { Tab } from '@/types';

export const FULL_TABS: Tab[] = [
  { id: 'overview', kind: 'overview', label: 'Overview', icon: 'overview', count: 3 },
  { id: 'issue',    kind: 'issue',   label: 'Issue',     icon: 'issue' },
  { id: 'diff',     kind: 'diff',    label: 'Diff',      icon: 'file', count: 8 },
  { id: 'pr',       kind: 'pr',      label: 'PR',        icon: 'pr', prNum: 4131 },
  { id: 'compare',  kind: 'compare', label: 'Compare',   icon: 'diff' },
  { id: 'claude',   kind: 'chat',    label: 'claude',    agent: 'c', state: 'running' },
  { id: 'claude-2', kind: 'chat',    label: 'claude',    agent: 'c', state: 'idle' },
  { id: 'codex',    kind: 'chat',    label: 'codex',     agent: 'x', state: 'errored' },
  { id: 'term',     kind: 'term',    label: 'Terminal',  icon: 'term', split: true },
  { id: 'review',   kind: 'md',      label: 'Review.md', icon: 'md' },
  { id: 'ticket',   kind: 'md',      label: 'Ticket.md', icon: 'md' },
];

export const NO_WT_TABS: Tab[] = [
  { id: 'overview', kind: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'issue',    kind: 'issue',   label: 'Issue',     icon: 'issue' },
];

export type AddKind = 'claude' | 'codex' | 'compare' | 'term' | 'md' | 'preview';
