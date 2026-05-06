import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Tab, Telemetry, Tweaks as TweaksType } from '@/types';
import { BASE_TICKER, LIVE_EVENTS } from '@/data/ticker';
import { ZenContext } from '@/context/zen';
import { Titlebar } from '@/components/layout/Titlebar';
import { Footbar } from '@/components/layout/Footbar';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ViewTabs } from '@/components/tabs/ViewTabs';
import { FULL_TABS, NO_WT_TABS, type AddKind } from '@/components/tabs/tabs';
import { ChatView } from '@/components/chat/ChatView';
import { TerminalView } from '@/components/terminal/TerminalView';
import { OverviewView } from '@/components/overview/OverviewView';
import { IssueView } from '@/components/issue/IssueView';
import { ReviewDoc } from '@/components/docs/ReviewDoc';
import { TicketDoc } from '@/components/docs/TicketDoc';
import { DiffTabView } from '@/components/diff/DiffTabView';
import { PRTabView } from '@/components/pr/PRTabView';
import { CompareTabView } from '@/components/compare/CompareTabView';
import { BranchSelector } from '@/components/worktree/BranchSelector';
import { AddWorktreeDialog } from '@/components/worktree/AddWorktreeDialog';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { Tweaks } from '@/components/tweaks/Tweaks';
import { useTweaks } from '@/components/tweaks/TweaksPanel';

const TWEAK_DEFAULTS: TweaksType = {
  density: 'comfortable',
  raceStyle: 'lanes',
  accent: 'confident',
  sidebarGroup: 'by-status',
  scanline: true,
  racing: true,
  hasWorktree: true,
};

export function App() {
  const [tweaks, setTweak] = useTweaks<TweaksType>(TWEAK_DEFAULTS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [worktrees, setWorktrees] = useState([
    'vf-1284-refactor-billing-reducer',
    'vf-1284-spike-immer',
    'vf-1284-rtk-experiment',
  ]);
  const [activeWorktree, setActiveWorktree] = useState('vf-1284-refactor-billing-reducer');
  const [wtDialogOpen, setWtDialogOpen] = useState(false);

  const [telem, setTelem] = useState<Telemetry>({
    ok: 121, fail: 4, tps: 184,
    spark: [3, 5, 7, 4, 6, 9, 8, 7, 11, 10, 9, 12, 15, 11, 9, 13, 15, 14, 12, 16, 18, 15, 13, 11, 9, 12, 14, 16, 15, 13],
  });

  useEffect(() => {
    if (!tweaks.racing) return;
    const id = setInterval(() => {
      setTelem((t) => ({
        ok: t.ok + (Math.random() > 0.7 ? 1 : 0),
        fail: t.fail,
        tps: 160 + Math.random() * 60,
        spark: [...t.spark.slice(1), 4 + Math.floor(Math.random() * 14)],
      }));
    }, 800);
    return () => clearInterval(id);
  }, [tweaks.racing]);

  const [activeTab, setActiveTab] = useState<string>(tweaks.hasWorktree ? 'pr' : 'overview');
  const [tabs, setTabs] = useState<Tab[]>(tweaks.hasWorktree ? FULL_TABS : NO_WT_TABS);

  const prevHasWtRef = useRef(tweaks.hasWorktree);
  useEffect(() => {
    if (prevHasWtRef.current === tweaks.hasWorktree) return;
    prevHasWtRef.current = tweaks.hasWorktree;
    if (tweaks.hasWorktree) {
      setTabs(FULL_TABS);
      setActiveTab('compare');
    } else {
      setTabs(NO_WT_TABS);
      setActiveTab('overview');
    }
  }, [tweaks.hasWorktree]);

  const [termSplit, setTermSplit] = useState(true);
  const [zenMode, setZenMode] = useState(false);

  useEffect(() => {
    if (!zenMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZenMode(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zenMode]);

  const closeTab = (id: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      if (activeTab === id && next.length) {
        const fallback = next[Math.max(0, idx - 1)] || next[0];
        setActiveTab(fallback.id);
      }
      return next;
    });
  };

  const addTab = (kind: AddKind) => {
    setTabs((prev) => {
      const sameKindCount = prev.filter((t) => {
        if (t.kind === 'chat' && (kind === 'claude' || kind === 'codex')) {
          return t.agent === (kind === 'claude' ? 'c' : 'x');
        }
        return t.kind === kind;
      }).length;
      const id = kind + '-' + (Date.now() % 100000);
      let tab: Tab;
      if (kind === 'claude')      tab = { id, kind: 'chat', label: 'claude', agent: 'c', state: 'idle' };
      else if (kind === 'codex')  tab = { id, kind: 'chat', label: 'codex',  agent: 'x', state: 'idle' };
      else if (kind === 'term')   tab = { id, kind: 'term', label: 'Terminal' + (sameKindCount ? ' ' + (sameKindCount + 1) : ''), icon: 'term' };
      else if (kind === 'compare') tab = { id, kind: 'compare', label: 'Compare' + (sameKindCount ? ' ' + (sameKindCount + 1) : ''), icon: 'diff' };
      else                        tab = { id, kind: 'md', label: 'Untitled.md', icon: 'md' };
      const next = [...prev, tab];
      setActiveTab(id);
      return next;
    });
  };

  const [ticker, setTicker] = useState(BASE_TICKER.map((e, i) => ({ ...e, key: 'base-' + i })));
  const seedRef = useRef(0);

  useEffect(() => {
    if (!tweaks.racing) return;
    const id = setInterval(() => {
      const e = LIVE_EVENTS[seedRef.current % LIVE_EVENTS.length];
      seedRef.current++;
      setTicker((prev) => {
        const next = [
          { ...e, key: 'live-' + seedRef.current, fresh: true },
          ...prev.map((p) => ({ ...p, fresh: false })),
        ];
        return next.slice(0, 14);
      });
    }, 4500);
    return () => clearInterval(id);
  }, [tweaks.racing]);

  const COLLAPSE_THRESHOLD = 168;
  const COLLAPSED_WIDTH = 60;
  const MAX_WIDTH = 480;
  const FULL_DEFAULT = 300;
  const [sideW, setSideW] = useState<number>(() => {
    const saved = parseInt(localStorage.getItem('vf.sideW') || '0', 10);
    return saved > 40 ? saved : FULL_DEFAULT;
  });
  const sideCollapsed = sideW <= COLLAPSE_THRESHOLD;
  const sideNarrow = sideW < 230;
  const effectiveW = sideCollapsed ? COLLAPSED_WIDTH : sideW;
  const [vDragging, setVDragging] = useState(false);
  const vDragRef = useRef<{ startX: number; startW: number } | null>(null);

  const onSideResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    setVDragging(true);
    vDragRef.current = { startX: e.clientX, startW: sideCollapsed ? COLLAPSED_WIDTH : sideW };
    const onMove = (ev: MouseEvent) => {
      const ds = vDragRef.current;
      if (!ds) return;
      const dx = ev.clientX - ds.startX;
      let next = ds.startW + dx;
      if (next < COLLAPSE_THRESHOLD) next = COLLAPSED_WIDTH;
      else next = Math.min(MAX_WIDTH, Math.max(180, next));
      setSideW(next);
    };
    const onUp = () => {
      vDragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setVDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  useEffect(() => {
    try { localStorage.setItem('vf.sideW', String(sideW)); } catch { /* ignore */ }
  }, [sideW]);

  const active = tabs.find((t) => t.id === activeTab);

  return (
    <div
      className={`frame ${settingsOpen ? 'settings-open' : ''}`}
      data-density={tweaks.density}
      data-scanline={tweaks.scanline ? 'on' : 'off'}
      data-side-collapsed={sideCollapsed ? 'true' : 'false'}
      data-side-narrow={sideNarrow ? 'true' : 'false'}
      data-zen={zenMode ? 'true' : 'false'}
      style={{ ['--side-w' as string]: effectiveW + 'px' } as CSSProperties}
    >
      <Titlebar tweaks={tweaks} />
      <div className="app">
        <Sidebar
          tweaks={tweaks}
          ticker={ticker}
          onOpenSettings={() => setSettingsOpen(true)}
          collapsed={sideCollapsed}
          narrow={sideNarrow}
        />
        <div
          className={`side-vresizer ${vDragging ? 'dragging' : ''}`}
          onMouseDown={onSideResizeStart}
          onDoubleClick={() => setSideW(sideCollapsed ? FULL_DEFAULT : COLLAPSED_WIDTH)}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          title="Drag to resize · double-click to collapse"
        />

        <section className="center">
          <div className="ctxbar">
            <span className="id-pill">VF-1284</span>
            <h1>Refactor billing reducer</h1>
            <div className="meta">
              <span>linear · </span><b>acme-web</b>
              {tweaks.hasWorktree && (
                <>
                  <span style={{ color: 'var(--vf-ink-700)' }}>·</span>
                  <span style={{ color: 'var(--vf-teal-300)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>main</span>
                  <span style={{ color: 'var(--vf-ink-700)' }}>←</span>
                  <BranchSelector
                    branches={worktrees}
                    current={activeWorktree}
                    onSelect={setActiveWorktree}
                    onAdd={() => setWtDialogOpen(true)}
                    baseBranch="main"
                  />
                </>
              )}
              {!tweaks.hasWorktree && (
                <>
                  <span style={{ color: 'var(--vf-ink-700)' }}>·</span>
                  <span style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)', fontSize: 11, fontStyle: 'italic' }}>
                    no worktree
                  </span>
                </>
              )}
            </div>
            <div className="spacer" />
            <div className="actions ctxbar-actions">
              <span className="tt-host">
                <button className="ctxbar-iconbtn" aria-label="Open in editor">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a4 4 0 0 1 5 5L8 23l-6 1 1-6Z" />
                  </svg>
                </button>
                <span className="tt">Open in editor<span className="tt-kbd">⌘E</span></span>
              </span>
              <span className="tt-host">
                <button className="ctxbar-iconbtn" aria-label="Open in Linear">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9" />
                    <path d="M3 12 12 3" />
                    <path d="M3 16l5 5" />
                  </svg>
                </button>
                <span className="tt">Open in Linear</span>
              </span>
              <span className="tt-host">
                <button className="ctxbar-iconbtn" aria-label="Copy Linear ID">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="8" y="8" width="13" height="13" rx="2" />
                    <path d="M3 16V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  <span className="ctxbar-iconbtn-tag">VF-1284</span>
                </button>
                <span className="tt">Copy Linear ID</span>
              </span>
              {tweaks.hasWorktree && (
                <>
                  <span className="ctxbar-divider" />
                  <span className="tt-host">
                    <button className="ctxbar-iconbtn" aria-label="Open PR on GitHub">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.04 1.53 1.04.9 1.53 2.36 1.09 2.93.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85V21c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
                      </svg>
                    </button>
                    <span className="tt">Open PR on GitHub</span>
                  </span>
                  <span className="tt-host">
                    <button className="ctxbar-iconbtn" aria-label="Copy PR ID">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" />
                        <path d="M6 8.5v7" /><path d="M6 6h6a3 3 0 0 1 3 3v9" />
                      </svg>
                      <span className="ctxbar-iconbtn-tag">#4128</span>
                    </button>
                    <span className="tt">Copy PR ID</span>
                  </span>
                </>
              )}
            </div>
          </div>

          <ViewTabs
            tabs={tabs}
            active={activeTab}
            onActive={setActiveTab}
            splitOn={termSplit}
            onToggleSplit={() => setTermSplit((s) => !s)}
            zenOn={zenMode}
            onToggleZen={() => setZenMode((z) => !z)}
            onCloseTab={closeTab}
            onAddTab={addTab}
            hasWorktree={tweaks.hasWorktree}
          />

          <ZenContext.Provider value={zenMode}>
            {active?.kind === 'compare' && <CompareTabView telem={telem} tweaks={tweaks} />}
            {active?.kind === 'diff' && <DiffTabView />}
            {active?.kind === 'pr' && <PRTabView />}
            {active?.kind === 'chat' && active.agent === 'c' && <ChatView agentKey="c" />}
            {active?.kind === 'chat' && active.agent === 'x' && <ChatView agentKey="x" />}
            {active?.kind === 'term' && <TerminalView split={termSplit} />}
            {active?.kind === 'overview' && <OverviewView hasWorktree={tweaks.hasWorktree} />}
            {active?.kind === 'issue' && <IssueView />}
            {active?.kind === 'md' && activeTab === 'review' && <ReviewDoc />}
            {active?.kind === 'md' && activeTab === 'ticket' && <TicketDoc />}
            {active?.kind === 'md' && activeTab !== 'review' && activeTab !== 'ticket' && <TicketDoc />}
          </ZenContext.Provider>
        </section>
      </div>
      <Footbar />
      <Tweaks tweaks={tweaks} setTweak={setTweak} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AddWorktreeDialog
        open={wtDialogOpen}
        baseBranch="main"
        currentBranch={activeWorktree}
        existing={worktrees}
        onCancel={() => setWtDialogOpen(false)}
        onConfirm={(name) => {
          setWorktrees((ws) => [...ws, name]);
          setActiveWorktree(name);
          setWtDialogOpen(false);
        }}
      />
    </div>
  );
}
