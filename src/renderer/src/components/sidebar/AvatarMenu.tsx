import { useEffect, useRef, useState } from 'react';

interface AvatarMenuProps {
  collapsed: boolean;
  onOpenSettings: () => void;
}

export function AvatarMenu({ collapsed: _collapsed, onOpenSettings }: AvatarMenuProps) {
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

  return (
    <span className="avatar-menu-wrap" ref={wrapRef}>
      <button
        className="avatar-btn"
        aria-label="Account menu"
        onClick={() => setOpen((o) => !o)}
        title="Erik Hallé"
      >
        <span className="avatar-sq">EH</span>
      </button>
      {open && (
        <div className="avatar-menu" role="menu">
          <div className="avatar-menu-h">
            <span className="avatar-sq">EH</span>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span className="nm">Erik Hallé</span>
              <span className="em">erik@acme-co.com</span>
            </div>
          </div>
          <button
            className="lin-row"
            onClick={() => { setOpen(false); onOpenSettings(); }}
          >
            <span className="lin-row-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
            </span>
            <span className="lin-row-lbl">Settings</span>
            <span style={{ font: '500 10px/1 var(--font-mono)', color: 'var(--muted-foreground)' }}>⌘,</span>
          </button>
          <button className="lin-row">
            <span className="lin-row-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" /><path d="M22 11h-6" /><path d="M19 8v6" />
              </svg>
            </span>
            <span className="lin-row-lbl">Switch workspace</span>
          </button>
          <button className="lin-row">
            <span className="lin-row-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            </span>
            <span className="lin-row-lbl">Help & docs</span>
          </button>
          <div className="avatar-menu-sep" />
          <button className="lin-row danger">
            <span className="lin-row-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span className="lin-row-lbl">Log out</span>
          </button>
        </div>
      )}
    </span>
  );
}
