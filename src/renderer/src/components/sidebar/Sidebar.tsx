import { useEffect, useRef, useState } from 'react';
import type { IssueStatus, Tweaks, TickerEvent } from '@/types';
import { STATUS_META } from '@/data/issues';
import { useIssuesByStatus } from '@/store/store';
import { I } from '@/icons';
import { StatusDot } from '@/components/common/StatusDot';
import { FilterMenu, type FilterSub } from './FilterMenu';
import { DisplayMenu, type Grouping, type Ordering } from './DisplayMenu';
import { AvatarMenu } from './AvatarMenu';
import { ActivityFeed } from '@/components/layout/ActivityFeed';
import logoMark from '@/assets/logo-mark.svg?raw';
import logoWordmark from '@/assets/logo-wordmark.svg?raw';

const STATUS_ORDER: { key: IssueStatus; live?: boolean }[] = [
  { key: 'backlog' },
  { key: 'todo' },
  { key: 'in_progress', live: true },
  { key: 'in_review' },
  { key: 'in_verification' },
  { key: 'done' },
  { key: 'cancelled' },
];

interface SidebarProps {
  tweaks: Tweaks;
  ticker: TickerEvent[];
  onOpenSettings: () => void;
  collapsed: boolean;
  narrow: boolean;
}

export function Sidebar({ ticker, onOpenSettings, collapsed, narrow }: SidebarProps) {
  const [filterMenu, setFilterMenu] = useState(false);
  const [filterSub, setFilterSub] = useState<FilterSub>(null);
  const [displayMenu, setDisplayMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [grouping, setGrouping] = useState<Grouping>('status');
  const [ordering, setOrdering] = useState<Ordering>('priority');
  const [showCompleted, setShowCompleted] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Set<IssueStatus>>(new Set());

  useEffect(() => {
    if (!filterMenu && !displayMenu) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.lin-menu') && !target.closest('.lin-trigger')) {
        setFilterMenu(false);
        setFilterSub(null);
        setDisplayMenu(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [filterMenu, displayMenu]);

  const toggleStatus = (k: IssueStatus) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  };

  const itemsByStatus = {
    backlog: useIssuesByStatus('backlog'),
    todo: useIssuesByStatus('todo'),
    in_progress: useIssuesByStatus('in_progress'),
    in_review: useIssuesByStatus('in_review'),
    in_verification: useIssuesByStatus('in_verification'),
    done: useIssuesByStatus('done'),
    cancelled: useIssuesByStatus('cancelled'),
  };

  const groups = STATUS_ORDER.flatMap((s) => {
    if (!showCompleted && (s.key === 'done' || s.key === 'cancelled')) return [];
    if (statusFilter.size > 0 && !statusFilter.has(s.key)) return [];
    return [{
      key: s.key,
      title: STATUS_META[s.key].label,
      live: s.live,
      items: itemsByStatus[s.key],
    }];
  });

  // Activity feed height (resizable). Persisted to localStorage.
  const [activityH, setActivityH] = useState<number>(() => {
    const saved = parseInt(localStorage.getItem('vf.activityH') || '0', 10);
    return saved > 80 ? saved : 220;
  });
  const dragStateRef = useRef<{ startY: number; startH: number } | null>(null);
  const activityHRef = useRef(activityH);
  useEffect(() => { activityHRef.current = activityH; }, [activityH]);

  const onResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    dragStateRef.current = { startY: e.clientY, startH: activityH };
    const onMove = (ev: MouseEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;
      const dy = ds.startY - ev.clientY;
      const next = Math.min(560, Math.max(120, ds.startH + dy));
      setActivityH(next);
    };
    const onUp = () => {
      dragStateRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      try { localStorage.setItem('vf.activityH', String(activityHRef.current)); } catch { /* ignore */ }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <aside className="side">
      <div className="side-top">
        <div className="side-brand">
          <span
            className="side-brand-mark"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: logoMark }}
          />
          <span
            className="side-brand-word"
            role="img"
            aria-label="Versaflow"
            dangerouslySetInnerHTML={{ __html: logoWordmark }}
          />
          <span className="side-brand-ws" title="Workspace">acme-co</span>
          <button className="side-brand-chev" aria-label="Workspace menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
        <div className={`search-row ${narrow ? 'is-narrow' : ''} ${searchFocused ? 'search-focused' : ''}`}>
          <div className="search">
            {I.search}
            <input
              placeholder="Search"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>
          <div className="lin-wrap">
            <button
              className={`lin-trigger ${filterMenu ? 'active' : ''} ${statusFilter.size > 0 ? 'has-filters' : ''}`}
              title="Filter"
              aria-label="Filter"
              onClick={(e) => {
                e.stopPropagation();
                setFilterMenu((v) => !v);
                setFilterSub(null);
                setDisplayMenu(false);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </button>
            {filterMenu && (
              <FilterMenu
                sub={filterSub}
                setSub={setFilterSub}
                statusFilter={statusFilter}
                toggleStatus={toggleStatus}
                onClose={() => { setFilterMenu(false); setFilterSub(null); }}
              />
            )}
          </div>
          <div className="lin-wrap">
            <button
              className={`lin-trigger ${displayMenu ? 'active' : ''}`}
              title="Display"
              aria-label="Display"
              onClick={(e) => {
                e.stopPropagation();
                setDisplayMenu((v) => !v);
                setFilterMenu(false);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="14" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="10" y2="18" />
                <circle cx="17" cy="6" r="2" />
                <circle cx="13" cy="18" r="2" />
              </svg>
            </button>
            {displayMenu && (
              <DisplayMenu
                grouping={grouping} setGrouping={setGrouping}
                ordering={ordering} setOrdering={setOrdering}
                showCompleted={showCompleted} setShowCompleted={setShowCompleted}
              />
            )}
          </div>
        </div>
      </div>

      <div className="issues-scroll" style={{ flex: '1 1 0', minHeight: 120 }}>
        {groups.map((g) => (
          <div className="group" key={g.key}>
            <div className={`group-h ${g.live ? 'live' : ''}`}>
              <StatusDot kind={g.key} />
              <span>{g.title}</span>
              <span className="num">{g.items.length}</span>
            </div>
            {g.items.map((it) => (
              <div key={String(it.id)} className="issue">
                <span className={`stat ${it.status}`} />
                <div className="issue-body">
                  <div className="issue-row issue-row-top">
                    <span className="id">{it.externalKey ?? ''}</span>
                  </div>
                  <div className="issue-row issue-row-bot">
                    <span className="title">{it.title}</span>
                  </div>
                </div>
                {collapsed && (
                  <span className="col-id">{it.externalKey ?? ''}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div
        className="side-resizer"
        onMouseDown={onResizeStart}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize activity feed"
        style={collapsed ? { display: 'none' } : undefined}
      >
        <span className="side-resizer-grip" />
      </div>

      {collapsed ? (
        <div className="side-activity-collapsed">
          <button className="side-activity-icon" aria-label="Activity feed" title="Activity (3 unread)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span className="unread-dot" />
          </button>
        </div>
      ) : (
        <ActivityFeed ticker={ticker} height={activityH} />
      )}

      <div className="side-foot">
        <AvatarMenu collapsed={collapsed} onOpenSettings={onOpenSettings} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
          <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>Erik Hallé</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>linear · acme-co</span>
        </div>
        <button
          className="side-foot-cog"
          title="Settings"
          aria-label="Settings"
          onClick={onOpenSettings}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
