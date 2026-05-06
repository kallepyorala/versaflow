import type { IssueStatus } from '@/types';
import { STATUSES, STATUS_META } from '@/data/issues';
import { StatusDot } from '@/components/common/StatusDot';

export type FilterSub = 'team' | 'status' | 'status_type' | 'assignee' | 'priority' | null;

interface FilterMenuProps {
  sub: FilterSub;
  setSub: (s: FilterSub) => void;
  statusFilter: Set<IssueStatus>;
  toggleStatus: (k: IssueStatus) => void;
  onClose: () => void;
}

export function FilterMenu({ sub, setSub, statusFilter, toggleStatus }: FilterMenuProps) {
  if (sub === 'status') {
    return (
      <div className="lin-menu lin-menu-sub" role="menu">
        <div className="lin-menu-h">
          <button className="lin-back" onClick={() => setSub(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <span>Status</span>
        </div>
        {STATUSES.map((s) => {
          const m = STATUS_META[s];
          const checked = statusFilter.has(s);
          return (
            <button
              key={s}
              className={`lin-row ${checked ? 'checked' : ''}`}
              onClick={() => toggleStatus(s)}
              role="menuitemcheckbox"
              aria-checked={checked}
            >
              <span className="lin-check">
                {checked && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              <StatusDot kind={s} />
              <span className="lin-row-lbl">{m.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="lin-menu" role="menu">
      <button className="lin-row" onClick={() => setSub('team')} role="menuitem">
        <span className="lin-row-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </span>
        <span className="lin-row-lbl">Team</span>
        <span className="lin-row-arrow">›</span>
      </button>
      <button className="lin-row active" onClick={() => setSub('status')} role="menuitem">
        <span className="lin-row-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" />
          </svg>
        </span>
        <span className="lin-row-lbl">Status</span>
        {statusFilter.size > 0 && <span className="lin-row-count">{statusFilter.size}</span>}
        <span className="lin-row-arrow">›</span>
      </button>
      <button className="lin-row" onClick={() => setSub('status_type')} role="menuitem">
        <span className="lin-row-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
          </svg>
        </span>
        <span className="lin-row-lbl">Status type</span>
        <span className="lin-row-arrow">›</span>
      </button>
      <button className="lin-row" onClick={() => setSub('assignee')} role="menuitem">
        <span className="lin-row-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </span>
        <span className="lin-row-lbl">Assignee</span>
        <span className="lin-row-arrow">›</span>
      </button>
      <button className="lin-row" onClick={() => setSub('priority')} role="menuitem">
        <span className="lin-row-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <rect x="5" y="13" width="3" height="6" />
            <rect x="10" y="9" width="3" height="10" />
            <rect x="15" y="5" width="3" height="14" />
          </svg>
        </span>
        <span className="lin-row-lbl">Priority</span>
        <span className="lin-row-arrow">›</span>
      </button>
    </div>
  );
}
