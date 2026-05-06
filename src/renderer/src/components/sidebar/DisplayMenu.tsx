import type { Dispatch, SetStateAction } from 'react';

export type Grouping = 'status' | 'priority' | 'assignee' | 'none';
export type Ordering = 'priority' | 'updated' | 'created';

interface DisplayMenuProps {
  grouping: Grouping;
  setGrouping: (g: Grouping) => void;
  ordering: Ordering;
  setOrdering: (o: Ordering) => void;
  showCompleted: boolean;
  setShowCompleted: Dispatch<SetStateAction<boolean>>;
}

export function DisplayMenu({ grouping, setGrouping, ordering, setOrdering, showCompleted, setShowCompleted }: DisplayMenuProps) {
  const groupings: Grouping[] = ['status', 'priority', 'assignee', 'none'];
  const orderings: Ordering[] = ['priority', 'updated', 'created'];
  return (
    <div className="lin-menu lin-menu-display" role="menu">
      <div className="lin-menu-section">
        <div className="lin-menu-label">Grouping</div>
        <div className="lin-seg">
          {groupings.map((g) => (
            <button
              key={g}
              className={`lin-seg-btn ${grouping === g ? 'active' : ''}`}
              onClick={() => setGrouping(g)}
            >
              {g[0].toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="lin-menu-section">
        <div className="lin-menu-label">Ordering</div>
        <div className="lin-seg">
          {orderings.map((o) => (
            <button
              key={o}
              className={`lin-seg-btn ${ordering === o ? 'active' : ''}`}
              onClick={() => setOrdering(o)}
            >
              {o[0].toUpperCase() + o.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="lin-menu-section">
        <div className="lin-menu-label">Show</div>
        <button
          className="lin-row toggle"
          onClick={() => setShowCompleted((v) => !v)}
          role="menuitemcheckbox"
          aria-checked={showCompleted}
        >
          <span className="lin-row-lbl">Completed issues</span>
          <span className={`lin-switch ${showCompleted ? 'on' : ''}`}>
            <span className="lin-switch-knob" />
          </span>
        </button>
      </div>
    </div>
  );
}
