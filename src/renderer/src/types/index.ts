import type { ReactNode } from 'react';

export type IssueStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'in_verification'
  | 'done'
  | 'cancelled';

export type WorktreeKind = 'none' | 'worktree' | 'pr';
export type PRState = 'open' | 'review' | 'merged';
export type ChecksState = 'pass' | 'pending' | 'fail';
export type AgentColor = 'c' | 'x' | 'g';
export type AgentState = 'active' | 'leading' | 'errored' | 'idle';

export interface Issue {
  id: number;
  externalId: string;
  externalKey: string;
  text: string;
  stat: IssueStatus;
  agents?: AgentColor[];
  spark?: number[];
  hot?: number;
  selected?: boolean;
  wt: WorktreeKind;
  branch?: string;
  worktrees?: string[];
  pr?: number;
  prState?: PRState;
  checks?: ChecksState;
  prs?: { pr: number; prState: PRState; checks: ChecksState }[];
}

export interface IssueGroup {
  title: string;
  key: IssueStatus;
  live?: boolean;
  items: Issue[];
}

export interface AgentFeedItem {
  tn: string;
  arg: string;
  ok?: string;
  fail?: string;
}

export interface Agent {
  key: string;
  letter: string;
  color: AgentColor;
  name: string;
  model: string;
  status: string;
  state: AgentState;
  progress: number;
  files: number;
  ok: number;
  fail: number;
  eta: string;
  timecode: string;
  nowDoing: string;
  feed: AgentFeedItem[];
  typing: string | null;
}

export interface FileEntry {
  ic: 'M' | 'A' | 'D';
  path: [string, string];
  pos: string | null;
  neg: string | null;
  selected?: boolean;
  dim?: boolean;
}

export type TickerKind = 'now' | 'ok' | 'tealed' | 'fail';

export interface TickerEvent {
  kind: TickerKind;
  t: string;
  iss?: string;
  l: ReactNode;
  key?: string;
  fresh?: boolean;
}

export interface Tweaks {
  density: 'dense' | 'comfortable' | 'loose';
  raceStyle: 'lanes' | 'cards' | 'tape';
  accent: 'restrained' | 'confident' | 'loud';
  sidebarGroup: 'by-status' | 'by-agent';
  scanline: boolean;
  racing: boolean;
  hasWorktree: boolean;
}

export type SetTweak = <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;

export interface Telemetry {
  ok: number;
  fail: number;
  tps: number;
  spark: number[];
}

export interface ChatTurn {
  who: 'user' | 'agent';
  name: string;
  time?: string;
  model?: string;
  streaming?: boolean;
  body: ReactNode;
}

export interface ChatThread {
  name: string;
  model: string;
  color: AgentColor;
  time: string;
  status: string;
  streaming?: boolean;
  winner?: boolean;
  errored?: boolean;
  turns: ChatTurn[];
}

export interface TabKindBase {
  id: string;
  label: string;
}

export type Tab =
  | (TabKindBase & { kind: 'overview'; icon: 'overview'; count?: number })
  | (TabKindBase & { kind: 'issue'; icon: 'issue' })
  | (TabKindBase & { kind: 'diff'; icon: 'file'; count?: number })
  | (TabKindBase & { kind: 'pr'; icon: 'pr'; prNum?: number })
  | (TabKindBase & { kind: 'compare'; icon: 'diff' })
  | (TabKindBase & { kind: 'chat'; agent: AgentColor; state: 'running' | 'idle' | 'errored' })
  | (TabKindBase & { kind: 'term'; icon: 'term'; split?: boolean })
  | (TabKindBase & { kind: 'md'; icon: 'md' });

export interface OvComment {
  id: number;
  file: string;
  lr: string;
  line: number;
  status: 'open' | 'addressed' | 'stale';
  body: string;
  anchor: string;
  stale?: boolean;
}

export interface IssueCommentItem {
  id: number;
  who: string;
  role: string;
  initials: string;
  color: string;
  when: string;
  body: ReactNode;
  reactions?: { e: string; n: number }[];
  agent?: boolean;
}
