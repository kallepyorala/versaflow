import { useMemo } from 'react';
import type { FileEntry } from '@/types';
import { OV_COMMENTS } from '@/data/comments';
import { fullPath, truncateMiddle } from '@/utils/files';

interface FilesPanelProps {
  collapsed: boolean;
  onToggle: () => void;
  query: string;
  setQuery: (s: string) => void;
  types: string[];
  setTypes: (t: string[]) => void;
  allTypes: string[];
  files: FileEntry[];
  activeFile: string;
  setActiveFile: (s: string) => void;
  collapsedFiles: string[];
  scrollToFile: (s: string) => void;
}

export function FilesPanel({
  collapsed, onToggle, query, setQuery, types, setTypes, allTypes,
  files, activeFile, collapsedFiles, scrollToFile,
}: FilesPanelProps) {
  const commentsByFile = useMemo(() => {
    const map: Record<string, { total: number; open: number }> = {};
    OV_COMMENTS.forEach((c) => {
      if (!map[c.file]) map[c.file] = { total: 0, open: 0 };
      map[c.file].total++;
      if (c.status === 'open' || c.status === 'stale') map[c.file].open++;
    });
    return map;
  }, []);

  if (collapsed) {
    return (
      <button className="files-collapsed" onClick={onToggle} title="Show files" type="button">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="files-collapsed-label">Files</span>
        <span className="num">{files.length}</span>
      </button>
    );
  }

  const totalAdd = files.reduce((s, f) => s + (f.pos ? parseInt(f.pos.replace('+', '')) : 0), 0);
  const totalDel = files.reduce((s, f) => s + (f.neg ? parseInt(f.neg.replace('−', '')) : 0), 0);
  const toggleType = (t: string) => {
    setTypes(types.includes(t) ? types.filter((x) => x !== t) : [...types, t]);
  };

  return (
    <aside className="files-panel">
      <div className="fp-head">
        <div className="fp-title-row">
          <span className="fp-title">Files</span>
          <span className="fp-count">{files.length}</span>
          <span className="fp-spacer" />
          <span className="fp-delta">
            <span className="pos">+{totalAdd}</span>
            <span className="neg">−{totalDel}</span>
          </span>
          <button className="fp-collapse" onClick={onToggle} title="Hide files" type="button">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
        <div className="fp-search">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="text"
            placeholder="Filter files…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && <button className="fp-clear" onClick={() => setQuery('')} title="Clear">×</button>}
        </div>
        <div className="fp-types">
          {allTypes.map((t) => {
            const on = types.includes(t);
            return (
              <button
                key={t}
                className={`fp-chip ${on ? 'on' : ''}`}
                onClick={() => toggleType(t)}
                type="button"
              >
                .{t}
              </button>
            );
          })}
          {types.length > 0 && (
            <button className="fp-chip clear" onClick={() => setTypes([])} type="button">clear</button>
          )}
        </div>
      </div>
      <div className="fp-list">
        {files.length === 0 && <div className="fp-empty">No files match.</div>}
        {files.map((f) => {
          const fp = fullPath(f);
          const isActive = activeFile === fp;
          const isCollapsed = collapsedFiles.includes(fp);
          const cmt = commentsByFile[fp];
          return (
            <button
              key={fp}
              className={`fp-row ${isActive ? 'active' : ''}`}
              onClick={() => scrollToFile(fp)}
              type="button"
              title={fp}
            >
              <span className={`fp-ic ${f.ic.toLowerCase()}`}>{f.ic}</span>
              <span className="fp-text">
                <span className="fp-fname-row">
                  <span className="fp-fname" title={f.path[1]}>{truncateMiddle(f.path[1], 24)}</span>
                  {cmt && (
                    <span
                      className={`fp-cmt ${cmt.open > 0 ? 'open' : 'addressed'}`}
                      title={`${cmt.total} comment${cmt.total === 1 ? '' : 's'}`}
                    >
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>{cmt.total}</span>
                    </span>
                  )}
                </span>
                <span className="fp-sub">
                  <span className="fp-dir">{f.path[0].replace(/\/$/, '')}</span>
                  <span className="fp-sub-spacer" />
                  {isCollapsed && (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                  {f.pos && <span className="pos">{f.pos}</span>}
                  {f.neg && <span className="neg">{f.neg}</span>}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
