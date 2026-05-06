import type { ReactNode } from 'react';
import { ICON_OV_ARROW_R } from '@/icons';

interface MigrationNoteProps {
  table: string;
  kind: 'add-column' | 'drop-column' | 'add-table' | 'drop-table' | 'rename' | 'data' | string;
  summary: ReactNode;
  before?: string[];
  after?: string[];
  notes?: ReactNode;
}

const KIND_LABEL: Record<string, string> = {
  'add-column': 'Add column',
  'drop-column': 'Drop column',
  'add-table': 'Add table',
  'drop-table': 'Drop table',
  rename: 'Rename',
  data: 'Data backfill',
};

export function MigrationNote({ table, kind, summary, before, after, notes }: MigrationNoteProps) {
  return (
    <div className="ov-mig">
      <div className="ov-mig-strip">
        <span className="stamp">migration</span>
        <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14a9 3 0 0 0 18 0V5" />
          <path d="M3 12a9 3 0 0 0 18 0" />
        </svg>
        <span>{KIND_LABEL[kind] ?? kind}</span>
        <span style={{ flex: 1 }} />
        <span style={{ color: 'var(--muted-foreground)', letterSpacing: '0.04em', textTransform: 'none', fontWeight: 500 }}>
          {table}
        </span>
      </div>
      <div className="ov-mig-body">
        <div className="ov-mig-title">{summary}</div>
        {before && after && (
          <div className="ov-mig-grid">
            <div className="ov-mig-col">
              <div className="lab">Before</div>
              {before.map((r, i) => <div key={i} className="val">{r}</div>)}
            </div>
            <div className="ov-mig-arrow">{ICON_OV_ARROW_R}</div>
            <div className="ov-mig-col">
              <div className="lab">After</div>
              {after.map((r, i) => (
                <div key={i} className={`val ${r.startsWith('+ ') ? 'new' : ''}`}>{r}</div>
              ))}
            </div>
          </div>
        )}
        {notes && <div className="ov-mig-foot">{notes}</div>}
      </div>
    </div>
  );
}
