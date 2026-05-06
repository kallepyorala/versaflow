import { useState } from 'react';
import { OV_COMMENTS } from '@/data/comments';
import { ICON_OV_SEND } from '@/icons';

interface CommentsRailProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

type Filter = 'open' | 'addressed' | 'all';

export function CommentsRail({ collapsed = false, onToggle }: CommentsRailProps) {
  const [filter, setFilter] = useState<Filter>('open');
  const [activeCmt, setActiveCmt] = useState<number>(2);

  const counts = {
    open: OV_COMMENTS.filter((c) => c.status === 'open' || c.status === 'stale').length,
    addressed: OV_COMMENTS.filter((c) => c.status === 'addressed').length,
    all: OV_COMMENTS.length,
  };

  const filtered = OV_COMMENTS.filter((c) => {
    if (filter === 'open') return c.status === 'open' || c.status === 'stale';
    if (filter === 'addressed') return c.status === 'addressed';
    return true;
  });

  const openCount = counts.open;

  if (collapsed) {
    return (
      <button className="ov-rail-collapsed" onClick={onToggle} title="Show comments" type="button">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="ov-rail-collapsed-label">Comments</span>
        <span className="num">{counts.all}</span>
        {openCount > 0 && <span className="ov-rail-collapsed-dot" title={`${openCount} open`} />}
      </button>
    );
  }

  return (
    <aside className="ov-rail">
      <div className="ov-rail-head">
        <div className="ov-rail-title">
          <span>Comments</span>
          <span className="num">{counts.all}</span>
          {onToggle && (
            <button className="ov-rail-collapse" onClick={onToggle} title="Hide comments" type="button">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
        <div className="ov-rail-filter" role="tablist">
          <button aria-selected={filter === 'open'} onClick={() => setFilter('open')}>Open · {counts.open}</button>
          <button aria-selected={filter === 'addressed'} onClick={() => setFilter('addressed')}>Done · {counts.addressed}</button>
          <button aria-selected={filter === 'all'} onClick={() => setFilter('all')}>All</button>
        </div>
      </div>
      <div className="ov-rail-list">
        {filtered.map((c) => (
          <div key={c.id} className={`ov-cmt ${activeCmt === c.id ? 'active' : ''} ${c.externalId === null ? 'is-pending' : ''}`} onClick={() => setActiveCmt(c.id)}>
            <div className="ov-cmt-top">
              <span className="ov-cmt-anchor">{c.file.split('/').pop()}:{c.lr}</span>
              <span className={`ov-cmt-stat ${c.status}`}>{c.status}</span>
            </div>
            <div className="ov-cmt-body">{c.body}</div>
            {c.stale && (
              <div className="ov-cmt-warn">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 9v4M12 17h.01" />
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
                Anchored line moved — re-anchor on next regen.
              </div>
            )}
            <div className="ov-cmt-foot">
              {c.status === 'addressed'
                ? <button>Reopen</button>
                : <button>Mark addressed</button>}
              <button>Dismiss</button>
              <button>Delete</button>
            </div>
          </div>
        ))}
      </div>
      <div className="ov-rail-foot">
        <button className="ov-btn primary" type="button" style={{ width: '100%', justifyContent: 'center' }}>
          {ICON_OV_SEND}
          <span>Send {openCount} to agent</span>
        </button>
      </div>
    </aside>
  );
}
