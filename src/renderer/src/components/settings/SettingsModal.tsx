import { useEffect, useState, type ReactNode } from 'react';
import { AppearancePane, type Theme } from './AppearancePane';
import { EditorPane, type EditorId } from './EditorPane';
import { LinearPane } from './LinearPane';
import { ReposPane } from './ReposPane';
import { AgentsPane } from './AgentsPane';
import { NotifsPane } from './NotifsPane';
import { ShortcutsPane } from './ShortcutsPane';
import { AccountPane } from './AccountPane';

type PageId = 'appearance' | 'editor' | 'linear' | 'repos' | 'agents' | 'notifs' | 'shortcuts' | 'account';

interface PageDef {
  id: PageId;
  label: string;
  icon: ReactNode;
}

const SETTINGS_PAGES: PageDef[] = [
  { id: 'appearance', label: 'Appearance', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 0 0 20" />
    </svg>
  ) },
  { id: 'editor', label: 'External editor', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a4 4 0 0 1 5 5L8 23l-6 1 1-6Z" />
    </svg>
  ) },
  { id: 'linear', label: 'Linear', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9" /><path d="M3 12 12 3" />
    </svg>
  ) },
  { id: 'repos', label: 'Repositories', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ) },
  { id: 'agents', label: 'AI agents', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4M8 16h.01M16 16h.01" />
    </svg>
  ) },
  { id: 'notifs', label: 'Notifications', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ) },
  { id: 'shortcuts', label: 'Shortcuts', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 9h.01M11 9h.01M15 9h.01M7 13h.01M11 13h.01M15 13h.01M7 17h10" />
    </svg>
  ) },
  { id: 'account', label: 'Account', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ) },
];

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [page, setPage] = useState<PageId>('appearance');
  const [theme, setTheme] = useState<Theme>('dark');
  const [editor, setEditor] = useState<EditorId>('zed');
  const [editingRepo, setEditingRepo] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="settings-overlay"
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).classList.contains('settings-overlay')) onClose();
      }}
    >
      <div className="settings-modal" role="dialog" aria-label="Settings">
        <aside className="settings-nav">
          <div className="settings-nav-h">
            <span className="settings-nav-title">Settings</span>
            <span className="settings-nav-sub">acme-co · Versaflow</span>
          </div>
          <nav className="settings-nav-list">
            {SETTINGS_PAGES.map((p) => (
              <button
                key={p.id}
                className={`settings-nav-item ${page === p.id ? 'active' : ''}`}
                onClick={() => setPage(p.id)}
              >
                <span className="settings-nav-ic">{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </nav>
          <div className="settings-nav-foot">
            <span className="kbd">esc</span>
            <span style={{ color: 'var(--muted-foreground)', marginLeft: 6 }}>to close</span>
          </div>
        </aside>
        <main className="settings-main">
          <div className="settings-main-h">
            <h2>{SETTINGS_PAGES.find((p) => p.id === page)?.label}</h2>
            <button className="settings-close" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="settings-body">
            {page === 'appearance' && <AppearancePane theme={theme} setTheme={setTheme} />}
            {page === 'editor'     && <EditorPane editor={editor} setEditor={setEditor} />}
            {page === 'linear'     && <LinearPane />}
            {page === 'repos'      && <ReposPane editingRepo={editingRepo} setEditingRepo={setEditingRepo} />}
            {page === 'agents'     && <AgentsPane />}
            {page === 'notifs'     && <NotifsPane />}
            {page === 'shortcuts'  && <ShortcutsPane />}
            {page === 'account'    && <AccountPane />}
          </div>
        </main>
      </div>
    </div>
  );
}
