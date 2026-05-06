import type { Issue } from '@/types';

export function WorktreeBadge({ it }: { it: Issue }) {
  const wt = it.wt || 'none';

  if (wt === 'none') {
    return (
      <span className="tt-host wt-host">
        <button
          className="wt-badge wt-create"
          aria-label="Create worktree"
          onClick={(e) => e.stopPropagation()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <span className="tt tt-left">Create worktree</span>
      </span>
    );
  }

  if (wt === 'worktree') {
    const wts = it.worktrees || (it.branch ? [it.branch] : []);
    const count = wts.length;
    return (
      <span className="tt-host wt-host">
        <span className="wt-badge wt-tree">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="2.5" />
            <circle cx="6" cy="18" r="2.5" />
            <circle cx="18" cy="9" r="2.5" />
            <path d="M6 8.5v7" />
            <path d="M6 6h6a3 3 0 0 1 3 3v0" />
          </svg>
          {count > 1 && <span className="wt-count">{count}</span>}
        </span>
        <span className="tt tt-left">
          {count > 1 ? `${count} worktrees` : 'Worktree'}
          <span className="tt-kbd">{count > 1 ? `${wts[0]} +${count - 1}` : (it.branch || 'feature')}</span>
        </span>
      </span>
    );
  }

  // pr
  const prs = it.prs || (it.pr ? [{ id: it.pr, number: it.pr, prState: it.prState!, checks: it.checks! }] : []);
  const prCount = prs.length;
  const checks = it.checks || 'pass';
  const checksClass = checks === 'fail' ? 'pr-fail' : checks === 'pending' ? 'pr-pending' : 'pr-pass';
  const stateLabel = it.prState === 'merged' ? 'merged' : it.prState === 'review' ? 'in review' : 'open';
  const checksLabel = checks === 'fail' ? 'checks failing' : checks === 'pending' ? 'checks running' : 'checks passing';

  return (
    <span className="tt-host wt-host">
      <span className={`wt-badge wt-pr ${checksClass}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 9h14" />
          <path d="M5 15h14" />
          <path d="M10 4 8 20" />
          <path d="M16 4l-2 16" />
        </svg>
        {prCount > 1 && <span className="wt-count">{prCount}</span>}
      </span>
      <span className="tt tt-left">
        {prCount > 1
          ? `${prCount} PRs · ${prs.map((p) => '#' + p.number).join(', ')}`
          : `PR #${it.pr} — ${stateLabel} · ${checksLabel}`}
      </span>
    </span>
  );
}
