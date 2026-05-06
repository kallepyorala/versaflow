import { Fragment, useEffect, useRef, useState } from 'react';
import type { Tab } from '@/types';
import {
  ICON_DIFF, ICON_TERM, ICON_MD, ICON_FILE, ICON_OVERVIEW, ICON_ISSUE, ICON_PR,
  ICON_PREVIEW, ICON_PLUS, ICON_X, ICON_SPLIT, ICON_ZEN_ENTER, ICON_ZEN_EXIT,
} from '@/icons';
import type { AddKind } from './tabs';

interface ViewTabsProps {
  tabs: Tab[];
  active: string;
  onActive: (id: string) => void;
  splitOn: boolean;
  onToggleSplit: () => void;
  zenOn: boolean;
  onToggleZen: () => void;
  onCloseTab?: (id: string) => void;
  onAddTab?: (kind: AddKind) => void;
  hasWorktree?: boolean;
}

export function ViewTabs({
  tabs, active, onActive, splitOn, onToggleSplit, zenOn, onToggleZen,
  onCloseTab, onAddTab, hasWorktree = true,
}: ViewTabsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number } | null>(null);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const openMenu = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setMenuPos({ left: r.left, top: r.bottom + 6 });
    }
    setMenuOpen((o) => !o);
  };

  const ADD_OPTIONS: { id: AddKind; name: string; desc: string }[] = hasWorktree
    ? [
        { id: 'claude', name: 'claude code', desc: 'New chat with claude.' },
        { id: 'codex', name: 'codex', desc: 'New chat with codex.' },
        { id: 'compare', name: 'compare', desc: 'Race agents side-by-side.' },
        { id: 'term', name: 'terminal', desc: 'Shell session.' },
        { id: 'preview', name: 'preview', desc: 'Live runtime view.' },
        { id: 'md', name: 'markdown', desc: 'Open a markdown doc.' },
      ]
    : [{ id: 'md', name: 'markdown', desc: 'Open a markdown doc.' }];

  const stateDotClass = (s: 'running' | 'idle' | 'errored') =>
    s === 'running' ? 'ok-dot' : s === 'errored' ? 'err-dot' : 'idle-dot';

  const tabIconFor = (icon?: string) => {
    switch (icon) {
      case 'pr': return ICON_PR;
      case 'diff': return ICON_DIFF;
      case 'term': return ICON_TERM;
      case 'md': return ICON_MD;
      case 'file': return ICON_FILE;
      case 'overview': return ICON_OVERVIEW;
      case 'issue': return ICON_ISSUE;
      case 'preview': return ICON_PREVIEW;
      default: return null;
    }
  };

  return (
    <div className="viewtabs">
      {tabs.map((t, i) => {
        const tabIcon = 'icon' in t ? tabIconFor(t.icon) : null;
        const isActive = active === t.id;
        const insertSep = i > 0 && tabs[i - 1].kind !== t.kind;
        const closeable = t.kind === 'chat' || t.kind === 'term' || t.kind === 'md' || t.kind === 'compare' || t.kind === 'preview';
        return (
          <Fragment key={t.id}>
            {insertSep && <span className="vtab-sep" />}
            <button
              className={`vtab ${t.kind === 'md' ? 'is-mono' : ''}`}
              aria-selected={isActive}
              onClick={() => onActive(t.id)}
            >
              {t.kind === 'chat' && <span className={`dot ${stateDotClass(t.state)}`} />}
              {tabIcon}
              <span>{t.label}</span>
              {t.kind === 'diff' && typeof t.count === 'number' && <span className="pill count">{t.count}</span>}
              {t.kind === 'overview' && typeof t.count === 'number' && <span className="pill count">{t.count}</span>}

              {closeable && (
                <span
                  className="x-close"
                  onClick={(e) => { e.stopPropagation(); onCloseTab?.(t.id); }}
                >
                  <span style={{ display: 'inline-grid', placeItems: 'center' }}>{ICON_X}</span>
                </span>
              )}
            </button>
          </Fragment>
        );
      })}
      <span className="pop-wrap" ref={wrapRef} style={{ alignSelf: 'center' }}>
        <button ref={btnRef} className="vtab-iconbtn" title="Add tab" aria-label="Add tab" onClick={openMenu}>
          {ICON_PLUS}
        </button>
        {menuOpen && menuPos && (
          <div className="pop" role="menu" style={{ position: 'fixed', left: menuPos.left, top: menuPos.top, bottom: 'auto' }}>
            <div className="pop-h">New tab</div>
            {ADD_OPTIONS.map((o) => (
              <button
                key={o.id}
                className="pop-item"
                type="button"
                onClick={() => { onAddTab?.(o.id); setMenuOpen(false); }}
              >
                <span />
                <span className="pi-name">
                  <span className="nm">{o.name}</span>
                  <span className="desc">{o.desc}</span>
                </span>
                <span />
              </button>
            ))}
          </div>
        )}
      </span>
      <span className="vtab-spacer" />
      <div className="vtab-tools">
        <button
          className="vtab-iconbtn"
          title={zenOn ? 'Exit zen mode' : 'Zen mode (full window)'}
          aria-label={zenOn ? 'Exit zen mode' : 'Zen mode'}
          aria-selected={zenOn || undefined}
          onClick={onToggleZen}
        >
          {zenOn ? ICON_ZEN_EXIT : ICON_ZEN_ENTER}
        </button>
        <span className="vtab-tools-sep" />
        <button
          className="vtab-iconbtn"
          title="Split view"
          aria-selected={splitOn || undefined}
          onClick={onToggleSplit}
        >
          {ICON_SPLIT}
        </button>
      </div>
    </div>
  );
}
