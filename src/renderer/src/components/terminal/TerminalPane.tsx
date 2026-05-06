import type { ReactNode } from 'react';

interface TerminalPaneProps {
  who: string;
  color?: 'c' | 'x';
  lines: ReactNode[];
}

export function TerminalPane({ who, color, lines }: TerminalPaneProps) {
  return (
    <div className="term-pane">
      <div className="term-head">
        <div className="lights"><span /><span /><span /></div>
        <span style={{ color: 'var(--muted-foreground)' }}>›</span>
        <span className={`who ${color === 'x' ? 'x' : ''}`}>{who}</span>
        <span className="spacer" />
        <span>vf-1284-refactor-billing-reducer</span>
      </div>
      <div className="term-body">
        {lines.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
