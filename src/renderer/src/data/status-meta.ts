import type { IssueStatus } from '@/types';

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
