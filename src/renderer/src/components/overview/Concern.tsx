import type { ReactNode } from 'react';

interface ConcernProps {
  severity?: 'info' | 'warn' | 'critical';
  title: ReactNode;
  anchor?: ReactNode;
  children?: ReactNode;
}

export function Concern({ severity = 'info', title, anchor, children }: ConcernProps) {
  return (
    <aside className={`ov-concern ${severity}`}>
      <div className="ov-concern-head">
        <span className={`ov-concern-sev ${severity}`}>{severity}</span>
        <span className="ov-concern-title">{title}</span>
        {anchor && <span className="ov-concern-anchor">{anchor}</span>}
      </div>
      <div className="ov-concern-body">{children}</div>
    </aside>
  );
}
