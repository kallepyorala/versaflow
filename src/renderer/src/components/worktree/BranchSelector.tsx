import { useEffect, useRef, useState } from 'react';

interface BranchSelectorProps {
  branches: string[];
  current: string;
  onSelect: (b: string) => void;
  onAdd: () => void;
  baseBranch?: string;
}

export function BranchSelector({ branches, current, onSelect, onAdd }: BranchSelectorProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const multi = branches.length > 1;

  return (
    <span className="branch-sel-wrap" ref={wrapRef}>
      <button
        className={`branch-sel-trigger ${open ? 'open' : ''}`}
        onClick={() => { if (multi) setOpen((o) => !o); }}
        title={multi ? 'Switch worktree' : current}
        style={multi ? undefined : { cursor: 'default' }}
      >
        <span>{current}</span>
        {multi && (
          <>
            <span className="branch-sel-count">{branches.length}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </>
        )}
      </button>
      <button className="branch-sel-add" aria-label="Add worktree" title="Add worktree" onClick={onAdd}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      {open && multi && (
        <div className="branch-sel-menu" role="menu">
          <div className="branch-sel-menu-h">Worktrees · {branches.length}</div>
          {branches.map((b) => (
            <button
              key={b}
              className={`branch-sel-row ${b === current ? 'active' : ''}`}
              onClick={() => { onSelect(b); setOpen(false); }}
            >
              <svg className="br-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="2.5" />
                <circle cx="6" cy="18" r="2.5" />
                <circle cx="18" cy="9" r="2.5" />
                <path d="M6 8.5v7" />
                <path d="M6 6h6a3 3 0 0 1 3 3v0" />
              </svg>
              <span className="br-name">{b}</span>
              {b === current && (
                <svg className="br-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
          <div className="branch-sel-divider" />
          <button
            className="branch-sel-row add-new"
            onClick={() => { setOpen(false); onAdd(); }}
          >
            <svg className="br-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="br-name">Add worktree…</span>
          </button>
        </div>
      )}
    </span>
  );
}
