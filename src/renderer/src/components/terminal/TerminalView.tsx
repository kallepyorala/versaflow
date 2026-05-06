import type { ReactNode } from 'react';
import { TerminalPane } from './TerminalPane';

export function TerminalView({ split }: { split: boolean }) {
  const claudeLines: ReactNode[] = [
    <><span className="pr">claude $</span> <span>vitest src/billing</span></>,
    <span className="dim"> RUN  v1.6.0 /Users/eh/acme-web</span>,
    <span className="dim"> ✓ src/billing/reducer.test.ts (12)</span>,
    <span className="dim"> ✓ src/billing/useBilling.test.ts (8)</span>,
    <span className="ok"> Test Files  2 passed (2)</span>,
    <span className="ok">      Tests  20 passed (20)</span>,
    <span className="dim">   Duration  612ms</span>,
    <></>,
    <><span className="pr">claude $</span> <span>tsc --noEmit</span></>,
    <span className="dim">checking 142 files…</span>,
    <span className="ok">✓ 0 errors</span>,
    <></>,
    <><span className="pr">claude $</span> <span className="caret" /></>,
  ];
  const codexLines: ReactNode[] = [
    <><span className="pr x">codex $</span> <span>vitest src/billing</span></>,
    <span className="dim"> RUN  v1.6.0 /Users/eh/acme-web</span>,
    <span className="dim"> ✓ src/billing/reducer.test.ts (12)</span>,
    <span className="dim"> ✓ src/billing/useBilling.test.ts (8)</span>,
    <span className="dim"> ✓ src/billing/actions.test.ts (28)</span>,
    <span className="ok"> Test Files  3 passed (3)</span>,
    <span className="ok">      Tests  48 passed (48)</span>,
    <span className="dim">   Duration  601ms</span>,
    <></>,
    <><span className="pr x">codex $</span> <span>vite build</span></>,
    <span className="dim">vite v5.0 building for production…</span>,
    <span className="dim">✓ 642 modules transformed.</span>,
    <span className="ok">✓ built in 4.21s</span>,
    <><span className="pr x">codex $</span> <span className="caret" /></>,
  ];
  return (
    <div className="terminals" style={{ flex: 1, minHeight: 0 }}>
      <div className={`term-grid ${split ? 'cols-2' : 'cols-1'}`}>
        <TerminalPane who="claude" color="c" lines={claudeLines} />
        {split && <TerminalPane who="codex" color="x" lines={codexLines} />}
      </div>
    </div>
  );
}
